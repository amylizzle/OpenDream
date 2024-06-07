using OpenDreamShared;
using Robust.Shared;
using Robust.Shared.Configuration;
using Robust.UnitTesting;

namespace Content.IntegrationTests;

// Partial class containing cvar logic
public static partial class PoolManager
{
    private static readonly (string cvar, string value)[] TestCvars =
    {
        (CVars.NetPVS.Name,                   "false"),
        (CVars.ThreadParallelCount.Name,      "1"),
        (CVars.ReplayClientRecordingEnabled.Name, "false"),
        (CVars.ReplayServerRecordingEnabled.Name, "false"),
        (CVars.NetBufferSize.Name, "0"),
        (OpenDreamCVars.JsonPath.Name, "")
    };

    public static async Task  SetupCVars(RobustIntegrationTest.IntegrationInstance instance, PoolSettings settings)
    {
        var cfg = instance.ResolveDependency<IConfigurationManager>();
        await instance.WaitPost(() =>
        {
            if (cfg.IsCVarRegistered(CVars.NetInterp.Name))
                cfg.SetCVar(CVars.NetInterp, settings.DisableInterpolate);

            if (cfg.IsCVarRegistered(CVars.NetInterp.Name))
                cfg.SetCVar(CVars.NetInterp, !settings.DisableInterpolate);
            if (cfg.IsCVarRegistered(OpenDreamCVars.JsonPath.Name))
                cfg.SetCVar(OpenDreamCVars.JsonPath, settings.JsonPath);
        });
    }

    private static void SetDefaultCVars(RobustIntegrationTest.IntegrationOptions options)
    {
        foreach (var (cvar, value) in TestCvars)
        {
            options.CVarOverrides[cvar] = value;
        }
    }
}
