using System;
using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages {
    public sealed class MsgWinSet : NetMessage {


        public string ControlId = String.Empty;
        public string Params = String.Empty;

        public override void ReadFromBuffer(NetIncomingMessage buffer) {
            ControlId = buffer.ReadString();
            Params = buffer.ReadString();
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer) {
            buffer.Write(ControlId);
            buffer.Write(Params);
        }
    }
}
