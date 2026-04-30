using System.Collections.Generic;
using JetBrains.Annotations;
using OpenDreamShared.EngineUtils;
using OpenDreamShared.Interface.DMF;




namespace OpenDreamShared.Interface.Descriptors;

public sealed partial class MacroSetDescriptor : ElementDescriptor {
    private readonly List<MacroDescriptor> _macros = new();
    public IReadOnlyList<MacroDescriptor> Macros => _macros;

    public MacroSetDescriptor(string id) {
        Type = new DMFPropertyString("MACRO_SET");
        Id = new DMFPropertyString(id);
    }

    [UsedImplicitly]
    public MacroSetDescriptor() {

    }

    public override MacroDescriptor CreateChildDescriptor(Dictionary<string, object> attributes) {
        var macro = SerializationManager.Read<MacroDescriptor>(attributes);

        _macros.Add(macro);
        return macro;
    }

    public override ElementDescriptor CreateCopy(string id) {
        var copy = SerializationManager.CreateCopy(this);

        copy._id = new DMFPropertyString(id);
        return copy;
    }
}

[UsedImplicitly]
public sealed partial class MacroDescriptor : ElementDescriptor {
    [DataField("command")]
    public string Command { get; private set; } = default!;
}
