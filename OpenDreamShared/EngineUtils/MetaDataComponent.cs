namespace OpenDreamShared.EngineUtils;

public sealed partial class MetaDataComponent : Component {
    [AutoNetworkedField] public partial string Name { get; set; } = string.Empty;
    [AutoNetworkedField] public partial string Description { get; set; } = string.Empty;
}
