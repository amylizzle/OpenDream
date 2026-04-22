using OpenDreamShared.Network;
using OpenDreamShared.Dream;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgPrompt : NetMessage {


    public int PromptId;
    public DreamValueType Types;
    public string Title = string.Empty;
    public string Message = string.Empty;
    public string DefaultValue = string.Empty;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        PromptId = buffer.ReadVariableInt32();
        Types = (DreamValueType) buffer.ReadUInt16();
        Title = buffer.ReadString();
        Message = buffer.ReadString();
        DefaultValue = buffer.ReadString();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.WriteVariableInt32(PromptId);
        buffer.Write((ushort) Types);
        buffer.Write(Title);
        buffer.Write(Message);
        buffer.Write(DefaultValue);
    }
}
