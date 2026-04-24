using OpenDreamRuntime.Input;
using OpenDreamRuntime.Objects.Types;
using OpenDreamRuntime.Procs.DebugAdapter;
using OpenDreamShared;
using OpenDreamShared.EngineUtils;
using System.IO;
using System.Linq;

[module: System.Runtime.CompilerServices.SkipLocalsInit]

namespace OpenDreamRuntime {
    public sealed class EntryPoint : GameServer {
        private readonly IEntitySystemManager _entitySystemManager = IoCManager.Resolve<IEntitySystemManager>();
        private readonly DreamManager _dreamManager = IoCManager.Resolve<DreamManager>();
        private readonly IConfigurationManager _configManager = IoCManager.Resolve<IConfigurationManager>();
        private readonly IPrototypeManager _prototypeManager = IoCManager.Resolve<IPrototypeManager>();
        private readonly IDreamDebugManager _debugManager = IoCManager.Resolve<IDreamDebugManager>();
        private readonly ServerInfoManager _serverInfoManager = IoCManager.Resolve<ServerInfoManager>();

        private ServerVerbSystem? _serverVerbSystem;

        public override void Init() {
            ServerContentIoC.Register();

            if(OpenDreamConfig.TracyEnable)
                Profiler.Activate();

            _serverInfoManager.Initialize();
        }

        public override void PostInit() {
            _serverVerbSystem = _entitySystemManager.GetEntitySystem<ServerVerbSystem>();

            int debugAdapterPort = OpenDreamConfig.DebugAdapterLaunched;
            if (debugAdapterPort == 0) {
                _dreamManager.PreInitialize(OpenDreamConfig.JsonPath);
                _dreamManager.StartWorld();
            } else {
                // The debug manager is responsible for running _dreamManager.PreInitialize() and .StartWorld()
                _debugManager.Initialize(debugAdapterPort);
            }
        }

        protected override void Dispose(bool disposing) {
            // Write every savefile to disk
            foreach (var savefile in DreamObjectSavefile.Savefiles.ToArray()) { //ToArray() to avoid modifying the collection while iterating over it
                try {
                    savefile.Close();
                } catch (Exception e) {
                    Logger.GetSawmill("opendream").Error($"Exception while flushing savefile '{savefile.Resource.ResourcePath}', data has been lost. {e}");
                }
            }

            _dreamManager.Shutdown();
            _debugManager.Shutdown();
            ByondApi.ByondApi.Shutdown();
        }

        public override void Update(ModUpdateLevel level, FrameEventArgs frameEventArgs) {
            if (level == ModUpdateLevel.PostEngine) {
                _serverVerbSystem?.RunRepeatingVerbs();
                _dreamManager.Update();
                _debugManager.Update();
            }
        }
    }
}
