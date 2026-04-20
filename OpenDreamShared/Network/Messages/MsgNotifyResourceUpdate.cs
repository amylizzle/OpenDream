using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgNotifyResourceUpdate : NetMessage {


    public int ResourceId;

    public override void ReadFromBuffer(NetIncomingMessage buffer, IRobustSerializer serializer) {
        ResourceId = buffer.ReadInt32();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer, IRobustSerializer serializer) {
        buffer.Write(ResourceId);
    }
}

