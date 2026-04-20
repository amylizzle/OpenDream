using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages {
    public sealed class MsgAckLoadInterface : NetMessage {


        public override void ReadFromBuffer(NetIncomingMessage buffer, IRobustSerializer serializer) {
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer, IRobustSerializer serializer) {
        }
    }
}
