using OpenDreamShared.Dream;
using OpenDreamShared.Rendering;

namespace OpenDreamClient.Rendering;

[RegisterComponent]
internal sealed partial class DMISpriteComponent : SharedDMISpriteComponent {
    public DreamIcon Icon { get; set; }
    public ScreenLocation? ScreenLocation { get; set; }
}
