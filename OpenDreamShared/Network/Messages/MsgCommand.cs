using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages {
    public sealed class MsgCommandRepeatStart : NetMessage {


        public string Command = string.Empty;

        public override void ReadFromBuffer(NetIncomingMessage buffer) {
            Command = buffer.ReadString();
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer) {
            buffer.Write(Command);
        }
    }

    public sealed class MsgCommandRepeatStop : NetMessage {


        public string Command = string.Empty;

        public override void ReadFromBuffer(NetIncomingMessage buffer) {
            Command = buffer.ReadString();
        }

        public override void WriteToBuffer(NetOutgoingMessage buffer) {
            buffer.Write(Command);
        }
    }
}
