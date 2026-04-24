using OpenDreamRuntime.Objects.Types;
using OpenDreamShared.Rendering;
using OpenDreamRuntime.Objects;


namespace OpenDreamRuntime.Rendering;

public sealed class ServerClientImagesSystem : SharedClientImagesSystem {
    private readonly PvsOverrideSystem _pvsOverrideSystem = IoCManager.Resolve<PvsOverrideSystem>();

    public void AddImageObject(DreamConnection connection, DreamObjectImage imageObject) {
        if (connection.Session == null || imageObject.GetAttachedLoc() is not { } loc)
            return;

        EntityUid locEntity = EntityUid.Invalid;
        Vector3 turfCoords = Vector3.Zero;

        if(loc is DreamObjectMovable movable)
            locEntity = movable.Entity;
        else if(loc is DreamObjectTurf turf)
            turfCoords = new Vector3(turf.X, turf.Y, turf.Z);

        EntityUid ent = GetEntityUid(locEntity);
        EntityUid imageObjectEntity = imageObject.Entity;
        EntityUid imageObjectEntityUid = GetEntityUid(imageObjectEntity);
        if (imageObjectEntity != EntityUid.Invalid)
            _pvsOverrideSystem.AddSessionOverride(imageObjectEntity, connection.Session);
        RaiseNetworkEvent(new AddClientImageEvent(ent, turfCoords, imageObjectEntityUid), connection.Session.Channel);
    }

    public void RemoveImageObject(DreamConnection connection, DreamObjectImage imageObject) {
        if (connection.Session == null || imageObject.GetAttachedLoc() is not { } loc)
            return;

        EntityUid locEntity = EntityUid.Invalid;
        Vector3 turfCoords = Vector3.Zero;

        if (loc is DreamObjectMovable movable)
            locEntity = movable.Entity;
        else if (loc is DreamObjectTurf turf)
            turfCoords = new Vector3(turf.X, turf.Y, turf.Z);

        EntityUid ent = GetEntityUid(locEntity);
        EntityUid imageObjectEntity = imageObject.Entity;
        if (imageObjectEntity != EntityUid.Invalid)
            _pvsOverrideSystem.RemoveSessionOverride(imageObjectEntity, connection.Session);
        EntityUid imageObjectEntityUid = GetEntityUid(imageObject.Entity);
        RaiseNetworkEvent(new RemoveClientImageEvent(ent, turfCoords, imageObjectEntityUid), connection.Session.Channel);
    }
}
