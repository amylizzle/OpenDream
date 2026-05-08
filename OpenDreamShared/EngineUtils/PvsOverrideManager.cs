using OpenDreamShared.Network;

namespace OpenDreamShared.EngineUtils;

public interface IPvsOverrideSystem {
    /// <summary>
    /// Forces the entity, all of its parents, and all of its children to ignore normal PVS range limitations,
    /// causing them to always be sent to all clients.
    /// </summary>
    public abstract void AddGlobalOverride(EntityUid uid);

    /// <summary>
    /// Removes an entity from the global overrides.
    /// </summary>
    public abstract void RemoveGlobalOverride(EntityUid uid);

    /// <summary>
    /// Forces the entity, all of its parents, and all of its children to ignore normal PVS range limitations for a
    /// specific session.
    /// </summary>
    public abstract void AddSessionOverride(EntityUid uid, ICommonSession session);

    /// <summary>
    /// Removes an entity from a session's overrides.
    /// </summary>
    public abstract void RemoveSessionOverride(EntityUid uid, ICommonSession session);

    /// <summary>
    /// This causes an entity and all of its parents to always be sent to a player.
    /// </summary>
    /// <remarks>
    /// This differs from <see cref="AddSessionOverride"/> as it does not send children, will ignore a players usual
    /// PVS budget, and ignores visibility masks. You generally shouldn't use this unless an entity absolutely always
    /// needs to be sent to a client.
    /// </remarks>
    public abstract void AddForceSend(EntityUid uid, ICommonSession session);


    /// <summary>
    /// Removes an entity from a session's force send set.
    /// </summary>
    public abstract void RemoveForceSend(EntityUid uid, ICommonSession session);
}

public sealed class PvsOverrideSystem : IPvsOverrideSystem {
    public void AddForceSend(EntityUid uid, ICommonSession session) {
        throw new System.NotImplementedException();
    }

    public void AddGlobalOverride(EntityUid uid) {
        throw new System.NotImplementedException();
    }

    public void AddSessionOverride(EntityUid uid, ICommonSession session) {
        throw new System.NotImplementedException();
    }

    public void RemoveForceSend(EntityUid uid, ICommonSession session) {
        throw new System.NotImplementedException();
    }

    public void RemoveGlobalOverride(EntityUid uid) {
        throw new System.NotImplementedException();
    }

    public void RemoveSessionOverride(EntityUid uid, ICommonSession session) {
        throw new System.NotImplementedException();
    }
}
