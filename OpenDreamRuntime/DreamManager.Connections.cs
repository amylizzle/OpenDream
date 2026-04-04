using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using OpenDreamRuntime;
using OpenDreamRuntime.Map;
using OpenDreamRuntime.Rendering;
using OpenDreamRuntime.Resources;
using OpenDreamShared;
using OpenDreamShared.Network.Messages;
using Robust.Shared.Configuration;
using Robust.Shared.Console;
using Robust.Shared.Enums;
using Robust.Shared.GameObjects;
using Robust.Shared.Network;
using Robust.Shared.Player;

namespace OpenDreamRuntime {
    public sealed partial class DreamManager {
        private static readonly byte[] ByondTopicHeaderRaw = { 0x00, 0x83 };
        private static readonly byte[] ByondTopicHeaderEncrypted = { 0x00, 0x15 };

        [Dependency] private readonly IServerNetManager _netManager = default!;
        [Dependency] private readonly IConfigurationManager _config = default!;

        private readonly Dictionary<NetUserId, DreamConnection> _connections = new();

        public IEnumerable<DreamConnection> Connections => _connections.Values;

        public ushort? ActiveTopicPort {
            get {
                if (_worldTopicSocket is null)
                    return null;

                if (_worldTopicSocket.LocalEndPoint is not IPEndPoint boundEndpoint) {
                    throw new NotSupportedException($"Cannot retrieve bound topic port! Endpoint: {_worldTopicSocket.LocalEndPoint}");
                }

                return (ushort)boundEndpoint.Port;
            }
        }

        private Socket? _worldTopicSocket;

        private Task? _worldTopicListener;
        private CancellationTokenSource? _worldTopicCancellationToken;

        private ulong _topicsProcessed;

        private void InitializeConnectionManager() {
            _playerManager.PlayerStatusChanged += OnPlayerStatusChanged;

            _netManager.RegisterNetMessage<MsgUpdateStatPanels>();
            _netManager.RegisterNetMessage<MsgSelectStatPanel>(RxSelectStatPanel);
            _netManager.RegisterNetMessage<MsgOutput>();
            _netManager.RegisterNetMessage<MsgAlert>();
            _netManager.RegisterNetMessage<MsgPrompt>();
            _netManager.RegisterNetMessage<MsgPromptList>();
            _netManager.RegisterNetMessage<MsgPromptResponse>(RxPromptResponse);
            _netManager.RegisterNetMessage<MsgSoundQuery>();
            _netManager.RegisterNetMessage<MsgSoundQueryResponse>(RxSoundQueryResponse);
            _netManager.RegisterNetMessage<MsgBrowseResource>();
            _netManager.RegisterNetMessage<MsgBrowseResourceRequest>(RxBrowseResourceRequest);
            _netManager.RegisterNetMessage<MsgBrowseResourceResponse>();
            _netManager.RegisterNetMessage<MsgBrowse>();
            _netManager.RegisterNetMessage<MsgLookupResource>(RxLookupResourceRequest);
            _netManager.RegisterNetMessage<MsgLookupResourceResponse>();
            _netManager.RegisterNetMessage<MsgTopic>(RxTopic);
            _netManager.RegisterNetMessage<MsgWinSet>();
            _netManager.RegisterNetMessage<MsgWinClone>();
            _netManager.RegisterNetMessage<MsgWinExists>();
            _netManager.RegisterNetMessage<MsgWinGet>();
            _netManager.RegisterNetMessage<MsgLink>();
            _netManager.RegisterNetMessage<MsgFtp>();
            _netManager.RegisterNetMessage<MsgLoadInterface>();
            _netManager.RegisterNetMessage<MsgAckLoadInterface>(RxAckLoadInterface);
            _netManager.RegisterNetMessage<MsgSound>();
            _netManager.RegisterNetMessage<MsgUpdateClientInfo>();
            _netManager.RegisterNetMessage<MsgAllAppearances>();

            var topicPort = _config.GetCVar(OpenDreamCVars.TopicPort);
            var worldTopicAddress = new IPEndPoint(IPAddress.Loopback, topicPort);
            _sawmill.Debug($"Binding World Topic at {worldTopicAddress}");
            _worldTopicSocket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp) {
                ReceiveTimeout = 5000,
                SendTimeout = 5000,
                ExclusiveAddressUse = false,
            };
            _worldTopicSocket.Bind(worldTopicAddress);
            _worldTopicSocket.Listen();
            _worldTopicCancellationToken = new CancellationTokenSource();
            _worldTopicListener = WorldTopicListener(_worldTopicCancellationToken.Token);
        }

        private void ShutdownConnectionManager() {
            _worldTopicSocket!.Dispose();
            _worldTopicCancellationToken!.Cancel();
        }

        private async Task ConsumeAndHandleWorldTopicSocket(Socket remote, CancellationToken cancellationToken) {
            var topicId = ++_topicsProcessed;
            try {
                using (remote)
                    try {
                        async Task<string?> ParseByondTopic(Socket from) {
                            var buffer = new byte[2];
                            await from.ReceiveAsync(buffer, cancellationToken);
                            if (!buffer.SequenceEqual(ByondTopicHeaderRaw)) {
                                if (buffer.SequenceEqual(ByondTopicHeaderEncrypted))
                                    _sawmill.Warning("Encrypted World Topic request is not implemented.");
                                return null;
                            }

                            await from.ReceiveAsync(buffer, cancellationToken);
                            if (BitConverter.IsLittleEndian)
                                buffer = buffer.Reverse().ToArray();
                            var length = BitConverter.ToUInt16(buffer);

                            buffer = new byte[length];
                            var totalRead = 0;
                            do {
                                var read = await from.ReceiveAsync(
                                    new Memory<byte>(buffer, totalRead, length - totalRead),
                                    cancellationToken);
                                if(read == 0 && totalRead != length) {
                                    _sawmill.Warning("failed to parse byond topic due to insufficient data read");
                                    return null;
                                }

                                totalRead += read;
                            } while (totalRead < length);

                            return Encoding.ASCII.GetString(buffer[6..^1]);
                        }

                        var topic = await ParseByondTopic(remote);
                        if (topic is null) {
                            return;
                        }

                        var remoteAddress = (remote.RemoteEndPoint as IPEndPoint)!.Address.ToString();
                        _sawmill.Debug($"World Topic #{topicId}: '{remoteAddress}' -> '{topic}'");
                        var tcs = new TaskCompletionSource<DreamValue>();
                        DreamThread.Run("Topic Handler", async state => {
                            var topicProc = WorldInstance.GetProc("Topic");

                            var result = await state.Call(topicProc, WorldInstance, null, new DreamValue(topic), new DreamValue(remoteAddress));
                            tcs.SetResult(result);
                            return result;
                        });

                        var topicResponse = await tcs.Task;
                        if (topicResponse.IsNull) {
                            return;
                        }

                        byte[] responseData;
                        byte responseType;
                        switch (topicResponse.Type) {
                            case DreamValue.DreamValueType.Float:
                                responseType = 0x2a;
                                responseData = BitConverter.GetBytes(topicResponse.MustGetValueAsFloat());
                                break;

                            case DreamValue.DreamValueType.String:
                                responseType = 0x06;
                                responseData = Encoding.ASCII.GetBytes(topicResponse.MustGetValueAsString().Replace("\0", "")).Append((byte)0x00).ToArray();
                                break;

                            case DreamValue.DreamValueType.DreamResource:
                            case DreamValue.DreamValueType.DreamObject:
                            case DreamValue.DreamValueType.DreamType:
                            case DreamValue.DreamValueType.DreamProc:
                            case DreamValue.DreamValueType.Appearance:
                            default:
                                _sawmill.Warning($"Unimplemented /world/Topic response type: {topicResponse.Type}");
                                return;
                        }

                        var totalLength = (ushort)(responseData.Length + 1);
                        var lengthData = BitConverter.GetBytes(totalLength);
                        if (BitConverter.IsLittleEndian)
                            lengthData = lengthData.Reverse().ToArray();

                        var responseBuffer = new List<byte>(ByondTopicHeaderRaw);
                        responseBuffer.AddRange(lengthData);
                        responseBuffer.Add(responseType);
                        responseBuffer.AddRange(responseData);
                        var responseActual = responseBuffer.ToArray();

                        var sent = await remote.SendAsync(responseActual, cancellationToken);
                        if (sent != responseActual.Length)
                            _sawmill.Warning("Failed to reply to /world/Topic: response buffer not fully sent");
                    }
                    finally {
                        await remote.DisconnectAsync(false, cancellationToken);
                    }
            } catch (Exception ex) {
                _sawmill.Warning("Error processing topic #{0}: {1}", topicId, ex);
            } finally {
                _sawmill.Debug("Finished world topic #{0}", topicId);
            }
        }

        private async Task WorldTopicListener(CancellationToken cancellationToken) {
            if (_worldTopicSocket is null)
                throw new InvalidOperationException("Attempted to start the World Topic Listener without a valid socket bind address.");

            while (!cancellationToken.IsCancellationRequested) {
                var pending = await _worldTopicSocket.AcceptAsync(cancellationToken);
                _ = ConsumeAndHandleWorldTopicSocket(pending, cancellationToken);
            }

            _worldTopicSocket!.Dispose();
            _worldTopicSocket = null!;
        }

        private void RxSelectStatPanel(MsgSelectStatPanel message) {
            var connection = ConnectionForChannel(message.MsgChannel);
            connection.HandleMsgSelectStatPanel(message);
        }

        private void RxPromptResponse(MsgPromptResponse message) {
            var connection = ConnectionForChannel(message.MsgChannel);
            connection.HandleMsgPromptResponse(message);
        }

        private void RxSoundQueryResponse(MsgSoundQueryResponse message) {
            var connection = ConnectionForChannel(message.MsgChannel);
            connection.HandleMsgSoundQueryResponse(message);
        }

        private void RxTopic(MsgTopic message) {
            var connection = ConnectionForChannel(message.MsgChannel);
            connection.HandleMsgTopic(message);
        }

        private void RxAckLoadInterface(MsgAckLoadInterface message) {
            // Once the client loaded the interface, move them to in-game.
            var player = _playerManager.GetSessionByChannel(message.MsgChannel);
            if(player.Status != SessionStatus.InGame) //Don't rejoin if this is a hot reload of interface
                _playerManager.JoinGame(player);
        }

        private void RxBrowseResourceRequest(MsgBrowseResourceRequest message) {
            var connection = ConnectionForChannel(message.MsgChannel);
            connection.HandleBrowseResourceRequest(message.Filename);
        }

        private void RxLookupResourceRequest(MsgLookupResource message) {
            if (_dreamResourceManager.TryLoadResource(message.ResourcePathOrRef, out var dreamResource)) {
                var msg = new MsgLookupResourceResponse() {
                    ResourceId = dreamResource.Id,
                    ResourcePathOrRef = message.ResourcePathOrRef,
                    Success = true
                };
                message.MsgChannel.SendMessage(msg);
            } else {
                var msg = new MsgLookupResourceResponse() {
                    ResourceId = 0,
                    ResourcePathOrRef = message.ResourcePathOrRef,
                    Success = false
                };
                message.MsgChannel.SendMessage(msg);
            }
        }

        private DreamConnection ConnectionForChannel(INetChannel channel) {
            return _connections[_playerManager.GetSessionByChannel(channel).UserId];
        }

        private void OnPlayerStatusChanged(object? sender, SessionStatusEventArgs e) {
            switch (e.NewStatus) {
                case SessionStatus.Connected:
                    var msgLoadInterface = new MsgLoadInterface {
                        InterfaceText = _dreamResourceManager.InterfaceFile?.ReadAsString()
                    };

                    e.Session.Channel.SendMessage(msgLoadInterface);
                    break;

                case SessionStatus.InGame: {
                    if (!_connections.TryGetValue(e.Session.UserId, out var connection)) {
                        connection = new DreamConnection(e.Session.Name);

                        _connections.Add(e.Session.UserId, connection);
                    }

                    connection.HandleConnection(e.Session);
                    break;
                }

                case SessionStatus.Disconnected: {
                    if (_connections.TryGetValue(e.Session.UserId, out var connection))
                        connection.HandleDisconnection();

                    break;
                }
            }
        }

        private void UpdateStat() {
            foreach (var connection in _connections.Values) {
                connection.UpdateStat();
            }
        }

        public DreamConnection GetConnectionBySession(ICommonSession session) {
            return _connections[session.UserId];
        }

        public void HotReloadInterface() {
            _dreamResourceManager.InterfaceFile?.ReloadFromDisk();

            var msgLoadInterface = new MsgLoadInterface {
                InterfaceText = _dreamResourceManager.InterfaceFile?.ReadAsString()
            };

            foreach (var connection in _connections.Values) {
                connection.Session?.Channel.SendMessage(msgLoadInterface);
            }
        }

        public void HotReloadResource(string fileName) {
            //ensure all paths are relative for consistency
            var path = Path.GetRelativePath(_dreamResourceManager.RootPath, fileName);
            var resource = _dreamResourceManager.LoadResource(path);
            var msgBrowseResource = new MsgNotifyResourceUpdate { //send a message that this resource id has been updated, let the clients handle re-requesting it
                ResourceId = resource.Id
            };

            resource.ReloadFromDisk();
            foreach (var connection in _connections.Values) {
                connection.Session?.Channel.SendMessage(msgBrowseResource);
            }
        }
    }
}

public sealed class HotReloadInterfaceCommand : IConsoleCommand {
    // ReSharper disable once StringLiteralTypo
    public string Command => "hotreloadinterface";
    public string Description => "Reload the .dmf interface and send the update to all clients";
    public string Help => "";
    public bool RequireServerOrSingleplayer => true;

    public void Execute(IConsoleShell shell, string argStr, string[] args) {
        if(!shell.IsLocal) {
            shell.WriteError("You cannot use this command as a client. Execute it on the server console.");
            return;
        }

        if (args.Length != 0) {
            shell.WriteError("This command does not take any arguments!");
            return;
        }

        DreamManager dreamManager = IoCManager.Resolve<DreamManager>();
        dreamManager.HotReloadInterface();
        shell.WriteLine("Reloading interface");
    }
}

public sealed class HotReloadResourceCommand : IConsoleCommand {
    // ReSharper disable once StringLiteralTypo
    public string Command => "hotreloadresource";
    public string Description => "Reload a specified resource and send the update to all clients who have the old version already";
    public string Help => "";
    public bool RequireServerOrSingleplayer => true;

    public void Execute(IConsoleShell shell, string argStr, string[] args) {
        if(!shell.IsLocal) {
            shell.WriteError("You cannot use this command as a client. Execute it on the server console.");
            return;
        }

        if (args.Length != 1) {
            shell.WriteError("This command requires a file path to reload as an argument! Example: hotreloadresource ./path/to/resource.dmi");
            return;
        }

        DreamManager dreamManager = IoCManager.Resolve<DreamManager>();
        shell.WriteLine($"Reloading {args[0]}");
        dreamManager.HotReloadResource(args[0]);
    }
}

internal sealed class UintArrayConverter : JsonConverter<uint[,]> {
    public override uint[,]? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options) {
        if (reader.TokenType != JsonTokenType.StartArray)
            throw new JsonException("Expected start of array");

        var rows = new List<uint[]>();
        while (reader.Read() && reader.TokenType != JsonTokenType.EndArray) {
            if (reader.TokenType != JsonTokenType.StartArray)
                throw new JsonException("Expected start of inner array");

            var row = new List<uint>();
            while (reader.Read() && reader.TokenType != JsonTokenType.EndArray) {
                if (reader.TokenType == JsonTokenType.Number) {
                    row.Add(reader.GetUInt32());
                }
            }
            rows.Add(row.ToArray());
        }

        if (rows.Count == 0)
            return new uint[0, 0];

        var result = new uint[rows.Count, rows[0].Length];
        for (int i = 0; i < rows.Count; i++) {
            for (int j = 0; j < rows[i].Length; j++) {
                result[i, j] = rows[i][j];
            }
        }
        return result;
    }

    public override void Write(Utf8JsonWriter writer, uint[,]? value, JsonSerializerOptions options) {
        if (value == null) {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStartArray();
        for (int i = 0; i < value.GetLength(0); i++) {
            writer.WriteStartArray();
            for (int j = 0; j < value.GetLength(1); j++) {
                writer.WriteNumberValue(value[i, j]);
            }
            writer.WriteEndArray();
        }
        writer.WriteEndArray();
    }
}

public sealed class DumpDataCommand : IConsoleCommand {
    public string Command => "dumpdata";
    public string Description => "Dump all ImmutableAppearances, Entities, and DreamResources to JSON files";
    public string Help => "";
    public bool RequireServerOrSingleplayer => true;

    public void Execute(IConsoleShell shell, string argStr, string[] args) {
        if(!shell.IsLocal) {
            shell.WriteError("You cannot use this command as a client. Execute it on the server console.");
            return;
        }

        if (args.Length != 0) {
            shell.WriteError("This command does not take any arguments!");
            return;
        }

        var entitySystemManager = IoCManager.Resolve<IEntitySystemManager>();
        var appearanceSystem = entitySystemManager.GetEntitySystem<ServerAppearanceSystem>();



        // Dump entities
        var entityManager = IoCManager.Resolve<IEntityManager>();

        var entities = entityManager.GetEntities().Select(e => new {
            EntityId = e.ToString(),
            Transform = entityManager.TryGetComponent<TransformComponent>(e, out var t) ? t.WorldPosition : Vector2.NaN,
            Sprite = entityManager.TryGetComponent<DMISpriteComponent>(e, out var s) ? appearanceSystem.AddAppearance(s.Appearance!).MustGetId() : 0
        }).ToList();
        var entitiesJson = JsonSerializer.Serialize(entities, new JsonSerializerOptions { WriteIndented = true, IncludeFields = true });
        File.WriteAllText("entities.json", entitiesJson);
        shell.WriteLine($"Dumped {entities.Count} entities to entities.json");

        var dreamResourceManager = IoCManager.Resolve<DreamResourceManager>();
        // Dump resources - index is ID
        List<IconResource> resources = dreamResourceManager.GetAllResources().Where(r => r is IconResource).Select(r => (IconResource)r).ToList();
        var DMIBase = resources.Select(r => new {
            Id = r.Id,
            ResourceData = r.ResourceData,
            ResourcePath = r.ResourcePath,
            DMIStates = r.DMI.ExportAsText()
        });
        var resourcesJson = JsonSerializer.Serialize(DMIBase, new JsonSerializerOptions { WriteIndented = true, IncludeFields = true });
        File.WriteAllText("resources.json", resourcesJson);
        shell.WriteLine($"Dumped {resources.Count} resources to resources.json");

        var dreamMapManager = IoCManager.Resolve<IDreamMapManager>();
        // Dump map tile IDs
        var tiles = dreamMapManager.GetMapAsTileIds(0);
        var mapOptions = new JsonSerializerOptions { WriteIndented = true, IncludeFields = true };
        mapOptions.Converters.Add(new UintArrayConverter());
        var mapJson = JsonSerializer.Serialize(tiles, mapOptions);
        File.WriteAllText("tileids.json", mapJson);
        shell.WriteLine($"Dumped map to tileids.json");

        // Dump appearances
        var appearances = appearanceSystem.GetImmutableAppearances();
        var appearancesJson = JsonSerializer.Serialize(appearances, new JsonSerializerOptions { WriteIndented = true, IncludeFields = true });
        File.WriteAllText("appearances.json", appearancesJson);
        shell.WriteLine($"Dumped {appearances.Length} appearances to appearances.json");

    }
}
