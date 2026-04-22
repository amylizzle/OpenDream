namespace OpenDreamShared.Network;

public enum NetDeliveryMethod {
    ReliableUnordered,
    ReliableOrdered,
    Unreliable,
}

public abstract class NetMessage {
    public abstract void ReadFromBuffer(NetIncomingMessage buffer);
    public abstract void WriteToBuffer(NetOutgoingMessage buffer);

}

public abstract class NetBuffer {

    public abstract bool ReadBoolean();
    public abstract void WriteBooelan(bool b);

    public abstract byte ReadByte();
    public abstract void WriteByte(byte b);
    public abstract sbyte ReadSByte();
    public abstract void WriteSByte(sbyte value);

    public abstract uint ReadUInt32();
    public abstract void WriteUInt32(uint value);

    public abstract int ReadInt32();
    public abstract void WriteInt32(int value);

    public abstract uint ReadUInt16();
    public abstract void WriteUInt16(uint value);

    public abstract int ReadInt16();
    public abstract void WriteInt16(int value);

    public abstract float ReadFloat();
    public abstract void WriteFloat(float value);

    public abstract float ReadSingle();
    public abstract void WriteSingle(float value);

    public abstract double ReadDouble();
    public abstract void WriteDouble(double value);

    public abstract string ReadString();
    public abstract void WriteString(string value);

    public abstract byte[] ReadBytes(int count);
    public abstract void WriteBytes(byte[] value);

    public abstract uint ReadVariableUInt32();
    public abstract void WriteVariableUInt32(uint value);

    public abstract int ReadVariableInt32();
    public abstract void WriteVariableInt32(int value);

    public abstract void ReadPadBits();
    public abstract void WritePadBits();

    public abstract void Write<T>(T value);
}
public class NetIncomingMessage : NetBuffer {

}

public class NetOutgoingMessage : NetBuffer {

}
