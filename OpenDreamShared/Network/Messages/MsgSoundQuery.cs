using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgSoundQuery : NetMessage {


    public int PromptId;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        PromptId = buffer.ReadVariableInt32();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.WriteVariableInt32(PromptId);
    }
}
