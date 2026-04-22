using System;
using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgWinClone : NetMessage {


    public string ControlId = String.Empty;
    public string CloneId = String.Empty;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        ControlId = buffer.ReadString();
        CloneId = buffer.ReadString();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(ControlId);
        buffer.Write(CloneId);
    }
}
