

using System;

using OpenDreamShared.Dream;
using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.Rendering;

public abstract partial class SharedDMISpriteComponent : Component {
    [Serializable, NetSerializable]
    public sealed class DMISpriteComponentState : ComponentState {
        public readonly uint? AppearanceId;
        public readonly ScreenLocation ScreenLocation;

        public DMISpriteComponentState(uint? appearanceId, ScreenLocation screenLocation) {
            AppearanceId = appearanceId;
            ScreenLocation = screenLocation;
        }
    }
}
