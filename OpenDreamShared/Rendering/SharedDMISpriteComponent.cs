

using System;

using OpenDreamShared.Dream;

namespace OpenDreamShared.Rendering;

[NetworkedComponent]
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
