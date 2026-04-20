using OpenDreamServer.Network;

namespace OpenDreamServer.Network;

public abstract class NetMessage {
    public abstract void ReadFromBuffer(NetIncomingMessage buffer, IRobustSerializer serializer);
    public abstract void WriteToBuffer(NetOutgoingMessage buffer, IRobustSerializer serializer);

}

public abstract class NetBuffer {

}
public class NetIncomingMessage : NetBuffer {

}

public class NetOutgoingMessage : NetBuffer {

}
