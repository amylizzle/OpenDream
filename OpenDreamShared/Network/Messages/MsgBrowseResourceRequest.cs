using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;
public sealed class MsgBrowseResourceRequest : NetMessage {
    // TODO: Browse should be on its own channel or something.


    public string Filename = string.Empty;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        Filename = buffer.ReadString();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(Filename);
    }
}
