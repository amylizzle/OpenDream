using System;

public class NetworkSystem {

    public virtual void Initialize() { }
    public virtual void Shutdown() { }

    protected void RaiseNetworkEvent(EntityEventArgs eventArgs) {
        throw new NotImplementedException();
    }

    protected void RaiseNetworkEvent(EntityEventArgs eventArgs, INetChannel channel) {
        throw new NotImplementedException();
    }
    protected void RaiseNetworkEvent(EntityEventArgs eventArgs, ICommonSession session) {
        throw new NotImplementedException();
    }

    protected void SubscribeNetworkEvent<T>(
        EntityEventHandler<T> handler,
        Type[]? before = null, Type[]? after = null)
        where T : notnull {
            throw new NotImplementedException();
    }

}

public delegate void EntityEventHandler<in T>(T ev);

public readonly struct EntitySessionEventArgs {
    public EntitySessionEventArgs(ICommonSession senderSession) {
        SenderSession = senderSession;
    }

    public ICommonSession SenderSession { get; }
}
