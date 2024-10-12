﻿using OpenDreamShared.Dream;
using Robust.Server.Player;
using Robust.Shared.Enums;
using SharedAppearanceSystem = OpenDreamShared.Rendering.SharedAppearanceSystem;
using System.Diagnostics.CodeAnalysis;
using OpenDreamShared.Network.Messages;
using Robust.Shared.Player;

namespace OpenDreamRuntime.Rendering;

public sealed class ServerAppearanceSystem : SharedAppearanceSystem {
    //use the appearance hash as the id!
    //appearance hash to weakref
    private readonly Dictionary<int, WeakReference<ImmutableIconAppearance>> _idToAppearance = new();

    public readonly ImmutableIconAppearance DefaultAppearance;

    /// <summary>
    /// This system is used by the PVS thread, we need to be thread-safe
    /// </summary>
    private readonly object _lock = new();

    private ISawmill _sawmill;

    [Dependency] private readonly IPlayerManager _playerManager = default!;

    public ServerAppearanceSystem() {
        DefaultAppearance = new ImmutableIconAppearance(IconAppearance.Default, this);
        _sawmill = Logger.GetSawmill("Appearance");
    }

    public override void Initialize() {
        _idToAppearance.Add(DefaultAppearance.GetHashCode(), new(DefaultAppearance));
        _playerManager.PlayerStatusChanged += OnPlayerStatusChanged;
    }

    public override void Shutdown() {
        lock (_lock) {
            _idToAppearance.Clear();
        }
    }

    private void OnPlayerStatusChanged(object? sender, SessionStatusEventArgs e) {
        if (e.NewStatus == SessionStatus.InGame) {
            //todo this is probably stupid slow
            lock (_lock) {
                Dictionary<int, IconAppearance> sendData = new(_idToAppearance.Count);
                ImmutableIconAppearance? immutable;
                foreach(int key in _idToAppearance.Keys ){
                    if(_idToAppearance[key].TryGetTarget(out immutable))
                        sendData.Add(key, immutable.ToMutable());
                }
                _sawmill.Debug($"Sending {sendData.Count} appearances to client");
                e.Session.Channel.SendMessage(new MsgAllAppearances(sendData));
            }

        }
    }

    public ImmutableIconAppearance AddAppearance(IconAppearance appearance) {
        ImmutableIconAppearance immutableAppearance = new(appearance, this);
        lock (_lock) {
            if(_idToAppearance.TryGetValue(immutableAppearance.GetHashCode(), out var weakReference) && weakReference.TryGetTarget(out var originalImmutable)) {
                return originalImmutable;
            } else {
                _idToAppearance[immutableAppearance.GetHashCode()] = new(immutableAppearance);
                //immutableAppearance.MarkRegistered();
                RaiseNetworkEvent(new NewAppearanceEvent(immutableAppearance.GetHashCode(), immutableAppearance.ToMutable()));
                _sawmill.Debug($"Created appearance ${immutableAppearance.GetHashCode()}");
                return immutableAppearance;
            }
        }
    }

    //this should only be called by the ImmutableIconAppearance's finalizer
    public void RemoveAppearance(ImmutableIconAppearance appearance) {
        lock (_lock) {
            //only remove if this is the exact same reference
            if(_idToAppearance.TryGetValue(appearance.GetHashCode(), out var weakReference) && weakReference.TryGetTarget(out var immutableIconAppearance) && object.ReferenceEquals(immutableIconAppearance,appearance)){
                _idToAppearance.Remove(appearance.GetHashCode());
                RaiseNetworkEvent(new RemoveAppearanceEvent(appearance.GetHashCode()));
                _sawmill.Debug($"Deleted appearance ${appearance.GetHashCode()}");
            }
        }
    }

    public ImmutableIconAppearance MustGetAppearanceByID(int appearanceId) {
        lock (_lock) {
            if(!_idToAppearance[appearanceId].TryGetTarget(out var result))
                throw new Exception($"Attempted to access deleted appearance ID ${appearanceId} in MustGetAppearanceByID()");
            return result;
        }
    }

    public bool TryGetAppearanceByID(int appearanceId, [NotNullWhen(true)] out ImmutableIconAppearance? appearance) {
        lock (_lock) {
            appearance = null;
            return _idToAppearance.TryGetValue(appearanceId, out var appearanceRef) && appearanceRef.TryGetTarget(out appearance);
        }
    }

    public void Animate(NetEntity entity, IconAppearance targetAppearance, TimeSpan duration, AnimationEasing easing, int loop, AnimationFlags flags, int delay, bool chainAnim) {
        int appearanceId = AddAppearance(targetAppearance).GetHashCode();

        RaiseNetworkEvent(new AnimationEvent(entity, appearanceId, duration, easing, loop, flags, delay, chainAnim));
    }
}
