using System;
using System.Data.SqlTypes;
using System.IO;

namespace OpenDreamShared.Network;

public enum NetDeliveryMethod {
    ReliableUnordered,
    ReliableOrdered,
    Unreliable,
}

public abstract class NetMessage {
    public virtual NetDeliveryMethod DeliveryMethod => NetDeliveryMethod.ReliableOrdered;
    public INetChannel MsgChannel;
    public abstract void ReadFromBuffer(NetIncomingMessage buffer);
    public abstract void WriteToBuffer(NetOutgoingMessage buffer);

    public NetMessage(INetChannel netChannel) {
        MsgChannel = netChannel;
    }

    public NetMessage() {
        MsgChannel = null!;
        throw new ArgumentException("NetMessage must be constructed with the NetChannel");
    }

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

    public void Write(bool value) { WriteBooelan(value); }
    public void Write(byte value) { WriteByte(value); }
    public void Write(sbyte value) { WriteSByte(value); }
    public void Write(int value) { WriteInt32(value); }
    public void Write(Int16 value) { WriteInt16(value); }
    public void Write(uint value) { WriteUInt32(value); }
    public void Write(UInt16 value) { WriteUInt16(value); }
    public void Write(float value) { WriteFloat(value); }
    public void Write(Double value) { WriteDouble(value); }
    public void Write(string value) { WriteString(value); }
    public void Write(byte[] value) { WriteBytes(value); }
}
public class NetIncomingMessage : NetBuffer {

    private BinaryReader binReader;

    public NetIncomingMessage(MemoryStream memoryStream) {
        binReader = new(memoryStream);
    }
    public override bool ReadBoolean() {
        return binReader.ReadBoolean();
    }

    public override byte ReadByte() {
        return binReader.ReadByte();
    }

    public override byte[] ReadBytes(int count) {
        return binReader.ReadBytes(count);
    }

    public override double ReadDouble() {
        return binReader.ReadDouble();
    }

    public override float ReadFloat() {
        return binReader.ReadSingle();
    }

    public override int ReadInt16() {
        return binReader.ReadInt16();
    }

    public override int ReadInt32() {
        return binReader.ReadInt32();
    }

    public override void ReadPadBits() {
        //do nothing
    }

    public override sbyte ReadSByte() {
        return (sbyte)binReader.ReadByte();
    }

    public override float ReadSingle() {
        return binReader.ReadSingle();
    }

    public override string ReadString() {
        return binReader.ReadString();
    }

    public override uint ReadUInt16() {
        return binReader.ReadUInt16();
    }

    public override uint ReadUInt32() {
        return binReader.ReadUInt32();
    }

    public override int ReadVariableInt32() {
        return binReader.Read7BitEncodedInt();
    }

    public override uint ReadVariableUInt32() {
        return (uint)binReader.Read7BitEncodedInt();
    }

    public override void WriteBooelan(bool b) {
        throw new System.NotImplementedException();
    }

    public override void WriteByte(byte b) {
        throw new System.NotImplementedException();
    }

    public override void WriteBytes(byte[] value) {
        throw new System.NotImplementedException();
    }

    public override void WriteDouble(double value) {
        throw new System.NotImplementedException();
    }

    public override void WriteFloat(float value) {
        throw new System.NotImplementedException();
    }

    public override void WriteInt16(int value) {
        throw new System.NotImplementedException();
    }

    public override void WriteInt32(int value) {
        throw new System.NotImplementedException();
    }

    public override void WritePadBits() {
        throw new System.NotImplementedException();
    }

    public override void WriteSByte(sbyte value) {
        throw new System.NotImplementedException();
    }

    public override void WriteSingle(float value) {
        throw new System.NotImplementedException();
    }

    public override void WriteString(string value) {
        throw new System.NotImplementedException();
    }

    public override void WriteUInt16(uint value) {
        throw new System.NotImplementedException();
    }

    public override void WriteUInt32(uint value) {
        throw new System.NotImplementedException();
    }

    public override void WriteVariableInt32(int value) {
        throw new System.NotImplementedException();
    }

    public override void WriteVariableUInt32(uint value) {
        throw new System.NotImplementedException();
    }
}

public class NetOutgoingMessage : NetBuffer {
    private BinaryWriter binaryWriter;

    public NetOutgoingMessage(MemoryStream memoryStream) {
        binaryWriter = new(memoryStream);
    }

    public override bool ReadBoolean() {
        throw new System.NotImplementedException();
    }

    public override byte ReadByte() {
        throw new System.NotImplementedException();
    }

    public override byte[] ReadBytes(int count) {
        throw new System.NotImplementedException();
    }

    public override double ReadDouble() {
        throw new System.NotImplementedException();
    }

    public override float ReadFloat() {
        throw new System.NotImplementedException();
    }

    public override int ReadInt16() {
        throw new System.NotImplementedException();
    }

    public override int ReadInt32() {
        throw new System.NotImplementedException();
    }

    public override void ReadPadBits() {
        throw new System.NotImplementedException();
    }

    public override sbyte ReadSByte() {
        throw new System.NotImplementedException();
    }

    public override float ReadSingle() {
        throw new System.NotImplementedException();
    }

    public override string ReadString() {
        throw new System.NotImplementedException();
    }

    public override uint ReadUInt16() {
        throw new System.NotImplementedException();
    }

    public override uint ReadUInt32() {
        throw new System.NotImplementedException();
    }

    public override int ReadVariableInt32() {
        throw new System.NotImplementedException();
    }

    public override uint ReadVariableUInt32() {
        throw new System.NotImplementedException();
    }

    public override void WriteBooelan(bool b) {
        binaryWriter.Write(b);
        throw new System.NotImplementedException();
    }

    public override void WriteByte(byte b) {
        throw new System.NotImplementedException();
    }

    public override void WriteBytes(byte[] value) {
        throw new System.NotImplementedException();
    }

    public override void WriteDouble(double value) {
        throw new System.NotImplementedException();
    }

    public override void WriteFloat(float value) {
        throw new System.NotImplementedException();
    }

    public override void WriteInt16(int value) {
        throw new System.NotImplementedException();
    }

    public override void WriteInt32(int value) {
        throw new System.NotImplementedException();
    }

    public override void WritePadBits() {
        throw new System.NotImplementedException();
    }

    public override void WriteSByte(sbyte value) {
        throw new System.NotImplementedException();
    }

    public override void WriteSingle(float value) {
        throw new System.NotImplementedException();
    }

    public override void WriteString(string value) {
        throw new System.NotImplementedException();
    }

    public override void WriteUInt16(uint value) {
        throw new System.NotImplementedException();
    }

    public override void WriteUInt32(uint value) {
        throw new System.NotImplementedException();
    }

    public override void WriteVariableInt32(int value) {
        throw new System.NotImplementedException();
    }

    public override void WriteVariableUInt32(uint value) {
        throw new System.NotImplementedException();
    }
}
