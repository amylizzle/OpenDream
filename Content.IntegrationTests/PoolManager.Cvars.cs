#nullable enable
using Content.Shared.CCVar;
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
        (CVars.NetBufferSize.Name, "0")
    };

    public static async Task  SetupCVars(RobustIntegrationTest.IntegrationInstance instance, PoolSettings settings)
    {
        var cfg = instance.ResolveDependency<IConfigurationManager>();
        await instance.WaitPost(() =>
        {
            if (cfg.IsCVarRegistered(CCVars.GameDummyTicker.Name))
                cfg.SetCVar(CCVars.GameDummyTicker, settings.UseDummyTicker);

            if (cfg.IsCVarRegistered(CCVars.GameLobbyEnabled.Name))
                cfg.SetCVar(CCVars.GameLobbyEnabled, settings.InLobby);

            if (cfg.IsCVarRegistered(CVars.NetInterp.Name))
                cfg.SetCVar(CVars.NetInterp, settings.DisableInterpolate);

            if (cfg.IsCVarRegistered(CCVars.GameMap.Name))
                cfg.SetCVar(CCVars.GameMap, settings.Map);

            if (cfg.IsCVarRegistered(CCVars.AdminLogsEnabled.Name))
                cfg.SetCVar(CCVars.AdminLogsEnabled, settings.AdminLogsEnabled);

            if (cfg.IsCVarRegistered(CVars.NetInterp.Name))
                cfg.SetCVar(CVars.NetInterp, !settings.DisableInterpolate);
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
