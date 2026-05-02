using System.Collections.Generic;
using OpenDreamShared.Network;



namespace OpenDreamShared.Network.Messages;

public sealed class MsgSoundQueryResponse : NetMessage {


    public int PromptId;
    public List<SoundData> Sounds = default!;

    public override void ReadFromBuffer(NetIncomingMessage buffer) {
        PromptId = buffer.ReadVariableInt32();
        var soundCount = (int)buffer.ReadUInt16();

        Sounds = new List<SoundData>(soundCount);

        if(soundCount == 0) return;

        for (var i = 0; i < soundCount; i++) {
            Sounds.Add(new SoundData(buffer));
        }
    }

    public override void WriteToBuffer(NetOutgoingMessage buffer) {
        buffer.WriteVariableInt32(PromptId);

        var soundCount = Sounds.Count;
        buffer.Write((ushort)soundCount);

        for (var i = 0; i < soundCount; i++) {
            Sounds[i].WriteToBuffer(buffer);
        }
    }
}
