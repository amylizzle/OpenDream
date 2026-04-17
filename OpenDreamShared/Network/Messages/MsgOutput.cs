using System;
using Lidgren.Network;



namespace OpenDreamShared.Network.Messages {
    public sealed class MsgOutput : NetMessage {
        public override MsgGroups MsgGroup => MsgGroups.EntityEvent;

        public string? Control;
        public string Value = String.Empty;

        public override void ReadFromBuffer(NetIncomingMessage buffer, IRobustSerializer serializer) {
            Value = buffer.ReadString();
            Control = buffer.ReadString();
            if (Control == string.Empty)
                Control = null;
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer, IRobustSerializer serializer) {
            buffer.Write(Value);
            buffer.Write(Control ?? string.Empty);
        }
    }
}
