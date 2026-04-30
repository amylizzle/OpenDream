


using System;
using System.Numerics;
using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.Rendering;


public class SharedClientImagesSystem : NetworkSystem {
    [Serializable, NetSerializable]
    public sealed class AddClientImageEvent(EntityUid attachedEntity, Vector3 turfCoords, EntityUid imageEntity)
        : EntityEventArgs {
        public Vector3 TurfCoords = turfCoords;
        public EntityUid AttachedEntity = attachedEntity; //if this is EntityUid.Invalid (ie, a turf) use the TurfCoords instead
        public EntityUid ImageEntity = imageEntity;
    }

    [Serializable, NetSerializable]
    public sealed class RemoveClientImageEvent(EntityUid attachedEntity, Vector3 turfCoords, EntityUid imageEntity)
        : EntityEventArgs {
        public Vector3 TurfCoords = turfCoords;
        public EntityUid AttachedEntity = attachedEntity; //if this is EntityUid.Invalid (ie, a turf) use the TurfCoords instead
        public EntityUid ImageEntity = imageEntity;
    }
}
