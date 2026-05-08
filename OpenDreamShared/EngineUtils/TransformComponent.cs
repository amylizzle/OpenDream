using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.EngineUtils;

public sealed partial class TransformComponent : Component {
    [AutoNetworkedField] public partial MapCoordinates Position {get; set;} = new();
    [AutoNetworkedField] public partial EntityUid Parent {get; set;} = EntityUid.Invalid;

}
