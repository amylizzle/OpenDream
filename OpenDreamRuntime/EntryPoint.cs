using OpenDreamRuntime.Input;
using OpenDreamRuntime.Objects.Types;
using OpenDreamRuntime.Procs.DebugAdapter;
using OpenDreamShared;
using OpenDreamShared.EngineUtils;
using System.IO;
using System.Linq;

[module: System.Runtime.CompilerServices.SkipLocalsInit]

namespace OpenDreamRuntime;

public sealed class GameServer : IDisposable {
    private readonly DreamManager _dreamManager = IoCManager.Resolve<DreamManager>();
    private readonly IDreamDebugManager _debugManager = IoCManager.Resolve<IDreamDebugManager>();

    private ServerVerbSystem? _serverVerbSystem;

    public void Init() {
        ServerContentIoC.Register();

        if (OpenDreamConfig.TracyEnable)
            Profiler.Activate();

    }

    public void PostInit() {
        _serverVerbSystem = IoCManager.Resolve<ServerVerbSystem>();

        int debugAdapterPort = OpenDreamConfig.DebugAdapterLaunched;
        if (debugAdapterPort == 0) {
            _dreamManager.PreInitialize(OpenDreamConfig.JsonPath);
            _dreamManager.StartWorld();
        } else {
            // The debug manager is responsible for running _dreamManager.PreInitialize() and .StartWorld()
            _debugManager.Initialize(debugAdapterPort);
        }
    }

    public void Dispose() {
        // Write every savefile to disk
        foreach (var savefile in DreamObjectSavefile.Savefiles.ToArray()) { //ToArray() to avoid modifying the collection while iterating over it
            try {
                savefile.Close();
            } catch (Exception e) {
                Logger.GetSawmill("opendream").Error($"Exception while flushing savefile '{savefile.Resource?.ResourcePath}', data has been lost. {e}");
            }
        }

        _dreamManager.Shutdown();
        _debugManager.Shutdown();
        ByondApi.ByondApi.Shutdown();
    }

    public void Update() {
        _serverVerbSystem?.RunRepeatingVerbs();
        _dreamManager.Update();
        _debugManager.Update();
    }
}

