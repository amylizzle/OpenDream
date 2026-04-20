using System;
using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages {
    public sealed class MsgTopic : NetMessage {


        public string Query = String.Empty;

        public override void ReadFromBuffer(NetIncomingMessage buffer, IRobustSerializer serializer) {
            Query = buffer.ReadString();
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer, IRobustSerializer serializer) {
            buffer.Write(Query);
        }
    }
}
