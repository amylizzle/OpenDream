


using System;
using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.Rendering {

    public class SharedScreenOverlaySystem : EntitySystem {
        [Serializable, NetSerializable]
        public sealed class AddScreenObjectEvent : EntityEventArgs {
            public NetEntity ScreenObject;

            public AddScreenObjectEvent(NetEntity screenObject) {
                ScreenObject = screenObject;
            }
        }

        [Serializable, NetSerializable]
        public sealed class RemoveScreenObjectEvent : EntityEventArgs {
            public NetEntity ScreenObject;

            public RemoveScreenObjectEvent(NetEntity screenObject) {
                ScreenObject = screenObject;
            }
        }
    }
}
