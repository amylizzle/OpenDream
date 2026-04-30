


using System;
using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.Rendering {

    public class SharedScreenOverlaySystem : NetworkSystem {
        [Serializable, NetSerializable]
        public sealed class AddScreenObjectEvent : EntityEventArgs {
            public EntityUid ScreenObject;

            public AddScreenObjectEvent(EntityUid screenObject) {
                ScreenObject = screenObject;
            }
        }

        [Serializable, NetSerializable]
        public sealed class RemoveScreenObjectEvent : EntityEventArgs {
            public EntityUid ScreenObject;

            public RemoveScreenObjectEvent(EntityUid screenObject) {
                ScreenObject = screenObject;
            }
        }
    }
}
