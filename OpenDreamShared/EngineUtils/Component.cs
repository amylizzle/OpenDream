using OpenDreamShared.Network;

namespace OpenDreamShared.EngineUtils;

public abstract class Component {
    protected INetManager _netManager = IoCManager.Resolve<INetManager>();
}
