using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using OpenDreamShared.Network;
using OpenDreamShared.Dream;




namespace OpenDreamShared.Network.Messages;

public sealed class MsgAllAppearances(Dictionary<uint, ImmutableAppearance> allAppearances) : NetMessage {

    public Dictionary<uint, ImmutableAppearance> AllAppearances = allAppearances;

    public MsgAllAppearances() : this(new()) { }

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        throw new System.NotImplementedException();
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.Write(AllAppearances.Count);
        foreach (var pair in AllAppearances) {
            pair.Value.WriteToBuffer(buffer);
        }
    }
}
