using System.Net;
using OpenDreamShared.Network;

public interface INetChannel {
    public IPEndPoint RemoteEndPoint { get; }
    public NetUserId UserId { get;}

    public void SendMessage(NetMessage message);
    public void Disconnect(string message);
    public void Disconnect();
}

public sealed class NetChannel : INetChannel {
    public IPEndPoint RemoteEndPoint => throw new System.NotImplementedException();

    public NetUserId UserId => throw new System.NotImplementedException();

    public void Disconnect(string message) {
        throw new System.NotImplementedException();
    }

    public void Disconnect() {
        throw new System.NotImplementedException();
    }

    public void SendMessage(NetMessage message) {
        throw new System.NotImplementedException();
    }
}

public abstract class EntityEventArgs { }
