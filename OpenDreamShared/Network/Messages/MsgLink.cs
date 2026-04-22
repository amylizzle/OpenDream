using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgLink : NetMessage {

    public override NetDeliveryMethod DeliveryMethod => NetDeliveryMethod.ReliableUnordered;

    public string Url = string.Empty;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        Url = buffer.ReadString();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(Url);
    }
}
