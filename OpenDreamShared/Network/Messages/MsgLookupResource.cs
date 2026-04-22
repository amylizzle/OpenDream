using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgLookupResource : NetMessage {
    public override NetDeliveryMethod DeliveryMethod => NetDeliveryMethod.ReliableUnordered;

    public string ResourcePathOrRef = "";

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        ResourcePathOrRef = buffer.ReadString();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(ResourcePathOrRef);
    }
}
