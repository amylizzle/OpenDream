
using System.Buffers;
using System.IO;
using System.Net.WebSockets;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using OpenDreamShared.Network;
using OpenDreamShared.Network.Messages;

public sealed class NetManager : INetManager {
    private Task websockTask;
    private int msgIdCounter = 0;
    private readonly Dictionary<Type, int> _msgTypeToId = new();
    private readonly Dictionary<int, Type> _idToMsgType = new();
    //websocket
    //spin up async listen on socket for message processing
    // handle login, register player with player manager, pass messages to/from player manager/socket
    // errors: unexpected client disconnect, bad login, malformed packets
    public void Init() {
        var builder = WebApplication.CreateBuilder();
        var app = builder.Build();

        app.UseWebSockets(new WebSocketOptions {
            KeepAliveInterval = TimeSpan.FromSeconds(30)
        });

        app.Map("/ws", async (HttpContext context) => {
            if (!context.WebSockets.IsWebSocketRequest) {
                context.Response.StatusCode = 400;
                return;
            }

            using var ws = await context.WebSockets
                .AcceptWebSocketAsync();
            var ct = context.RequestAborted;
            var buffer = ArrayPool<byte>.Shared.Rent(4096);

            try {
                while (ws.State == WebSocketState.Open) {
                    var result = await ws.ReceiveAsync(buffer, ct);
                    if (result.MessageType ==
                        WebSocketMessageType.Close)
                        break;

                    //Okay, here we need to read the message type, create the appropriate NetMessage
                    //fill out the fields, and raise the netmessage with the appropriate callbacks


                    await ws.SendAsync(
                        buffer.AsMemory(0, result.Count),
                        result.MessageType,
                        result.EndOfMessage, ct
                    );
                }
            }
            finally {
                ArrayPool<byte>.Shared.Return(buffer);
            }
        });

        websockTask = app.RunAsync();
    }

    public void RegisterNetMessage<T>(INetManager.ProcessMessage<T> callback = null) where T : NetMessage, new() {
        if (_msgTypeToId.TryGetValue(typeof(T), out var msgId)) {
            //add to callbacks
        } else {
            //inc counter, add to dicts, then add callback
        }
    }

    public void MarkDirty(Component c, string fieldName) {
        throw new NotImplementedException();
    }
}


