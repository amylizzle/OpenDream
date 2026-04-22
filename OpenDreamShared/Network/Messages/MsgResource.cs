using System;
using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgResource : NetMessage {
    public override NetDeliveryMethod DeliveryMethod => NetDeliveryMethod.ReliableUnordered;

    public int ResourceId;
    public byte[] ResourceData = Array.Empty<byte>();

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        ResourceId = buffer.ReadInt32();
        var dataLen = buffer.ReadVariableInt32();
        ResourceData = buffer.ReadBytes(dataLen);
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(ResourceId);
        buffer.WriteVariableInt32(ResourceData.Length);
        buffer.Write(ResourceData);
    }
}
