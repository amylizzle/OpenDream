

using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.Rendering;
public sealed partial class DreamMobSightComponent : Component {
    //this would be a good place for:
    //see_in_dark
    //see_infrared
    [AutoNetworkedField] public partial sbyte SeeInvisibility { get; set; }
    [AutoNetworkedField] public partial SightFlags Sight { get; set; }
}
