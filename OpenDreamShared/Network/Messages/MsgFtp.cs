using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgFtp : NetMessage {

    public override NetDeliveryMethod DeliveryMethod => NetDeliveryMethod.ReliableUnordered;

    public int ResourceId;
    public string SuggestedName = string.Empty;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        ResourceId = buffer.ReadInt32();
        SuggestedName = buffer.ReadString();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(ResourceId);
        buffer.Write(SuggestedName);
    }
}
