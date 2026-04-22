using System;
using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages {
    public sealed class MsgTopic : NetMessage {


        public string Query = String.Empty;

        public override void ReadFromBuffer(NetIncomingMessage buffer) {
            Query = buffer.ReadString();
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer) {
            buffer.Write(Query);
        }
    }
}
