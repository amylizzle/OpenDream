using OpenDreamShared.EngineUtils;

public sealed partial class TransformComponent : Component {
    [AutoNetworkedField] public partial MapCoordinates Position {get; set;}
    [AutoNetworkedField] public partial EntityUid Parent {get; set;}

}
