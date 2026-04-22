using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;
public sealed class MsgBrowseResource : NetMessage {
    // TODO: Browse should be on its own channel or something.


    public string Filename = string.Empty;
    public byte[] DataHash = [];

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        Filename = buffer.ReadString();
        DataHash = buffer.ReadBytes(32);
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(Filename);
        buffer.Write(DataHash);
    }
}
