using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgNotifyResourceUpdate : NetMessage {


    public int ResourceId;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        ResourceId = buffer.ReadInt32();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(ResourceId);
    }
}

