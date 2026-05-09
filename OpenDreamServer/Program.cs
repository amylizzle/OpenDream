using OpenDreamRuntime;
using OpenDreamShared.EngineUtils;
using OpenDreamShared.Network;

namespace OpenDreamServer;

internal static class Program {
    private static void Main(string[] args) {
        IoCManager.Register<INetManager, NetManager>();
        ServerContentIoC.Register();
        using var content = new OpenDreamRuntime.GameServer();
        content.Init();
        content.PostInit();
        content.Update();
    }
}
