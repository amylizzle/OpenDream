using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgLookupResourceResponse : NetMessage {
    public override NetDeliveryMethod DeliveryMethod => NetDeliveryMethod.ReliableUnordered;

    public int ResourceId;
    public string ResourcePathOrRef = "";
    public bool Success;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        ResourceId = buffer.ReadInt32();
        ResourcePathOrRef = buffer.ReadString();
        Success = buffer.ReadBoolean();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(ResourceId);
        buffer.Write(ResourcePathOrRef);
        buffer.Write(Success);
    }
}

