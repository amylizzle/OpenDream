using OpenDreamShared.EngineUtils;
using OpenDreamShared.Network;

namespace OpenDreamServer;

internal static class Program {
    private static void Main(string[] args) {
        using var content = new OpenDreamRuntime.GameServer();
        content.Init();
        content.PostInit();
        content.Update();
        IoCManager.Register<INetManager, NetManager>();

    }
}
