using OpenDreamRuntime.Objects.Types;
using OpenDreamShared.Rendering;


namespace OpenDreamRuntime.Rendering;

public sealed class ServerScreenOverlaySystem : SharedScreenOverlaySystem {
    private readonly EntityManager _entityManager = IoCManager.Resolve<EntityManager>();
    private readonly PvsOverrideSystem _pvsOverride = IoCManager.Resolve<PvsOverrideSystem>();

    public void AddScreenObject(DreamConnection connection, DreamObjectMovable screenObject) {
        if (connection.Session is null)
            return;

        _pvsOverride.AddForceSend(screenObject.Entity, connection.Session);

        NetEntity ent = _entityManager.GetNetEntity(screenObject.Entity);
        RaiseNetworkEvent(new AddScreenObjectEvent(ent), connection.Session.Channel);
    }

    public void RemoveScreenObject(DreamConnection connection, DreamObjectMovable screenObject) {
        if (connection.Session is null)
            return;

        _pvsOverride.RemoveForceSend(screenObject.Entity, connection.Session);

        NetEntity ent = _entityManager.GetNetEntity(screenObject.Entity);
        RaiseNetworkEvent(new RemoveScreenObjectEvent(ent), connection.Session.Channel);
    }
}
