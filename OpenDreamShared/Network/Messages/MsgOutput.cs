using System;
using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages {
    public sealed class MsgOutput : NetMessage {


        public string? Control;
        public string Value = String.Empty;

        public override void ReadFromBuffer(NetIncomingMessage buffer) {
            Value = buffer.ReadString();
            Control = buffer.ReadString();
            if (Control == string.Empty)
                Control = null;
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer) {
            buffer.Write(Value);
            buffer.Write(Control ?? string.Empty);
        }
    }
}
