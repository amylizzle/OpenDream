using OpenDreamShared.Dream;
using OpenDreamShared.EngineUtils;
namespace OpenDreamRuntime.Rendering;

public sealed partial class DMISpriteComponent : Component {

    [AutoNetworkedField] public partial ScreenLocation ScreenLocation { get; set; }

    [AutoNetworkedField] private partial uint _appearanceId { get; set; }
    public ImmutableAppearance? Appearance {get => IoCManager.Resolve<ServerAppearanceSystem>().MustGetAppearanceById(_appearanceId) ; set => _appearanceId = value?.Id ?? 0; }
}

