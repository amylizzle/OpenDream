using System;

namespace OpenDreamShared.EngineUtils;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct | AttributeTargets.Enum, AllowMultiple = false, Inherited = false)]
public sealed class NetSerializableAttribute : Attribute
{
}

[AttributeUsage(AttributeTargets.Property|AttributeTargets.Field)]
public class AutoNetworkedFieldAttribute : Attribute { }


[AttributeUsage(AttributeTargets.Property|AttributeTargets.Field)]
public class DataField(string name, bool required=false) : Attribute { public string ParsingName = name; public bool Required = required; }
