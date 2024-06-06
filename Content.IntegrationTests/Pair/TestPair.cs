﻿using System.Collections.Generic;
using System.IO;
using Robust.Shared.IoC;
using Robust.Shared.Network;
using Robust.Shared.Timing;
using Robust.UnitTesting;

namespace Content.IntegrationTests.Pair;

/// <summary>
/// This object wraps a pooled server+client pair.
/// </summary>
public sealed partial class TestPair
{
    // TODO remove this.
    [Obsolete("Field access is redundant")]
    public TestPair Pair => this;

    public readonly int Id;
    private bool _initialized;
    private TextWriter _testOut = default!;
    public readonly Stopwatch Watch = new();
    public readonly List<string> TestHistory = new();
    public PoolSettings Settings = default!;
    public RobustIntegrationTest.ServerIntegrationInstance Server { get; private set; } = default!;
    public RobustIntegrationTest.ClientIntegrationInstance Client { get;  private set; } = default!;

    public PoolTestLogHandler ServerLogHandler { get;  private set; } = default!;
    public PoolTestLogHandler ClientLogHandler { get;  private set; } = default!;

    public TestPair(int id)
    {
        Id = id;
    }

    public async Task Initialize(PoolSettings settings, TextWriter testOut)
    {
        if (_initialized)
            throw new InvalidOperationException("Already initialized");

        _initialized = true;
        Settings = settings;
        (Client, ClientLogHandler) = await PoolManager.GenerateClient(settings, testOut);
        (Server, ServerLogHandler) = await PoolManager.GenerateServer(settings, testOut);
        ActivateContext(testOut);

        if (settings.ShouldBeConnected)
        {
            Client.SetConnectTarget(Server);
            await Client.WaitPost(() =>
            {
                var netMgr = IoCManager.Resolve<IClientNetManager>();
                if (!netMgr.IsConnected)
                {
                    netMgr.ClientConnect(null!, 0, null!);
                }
            });
            await ReallyBeIdle(10);
            await Client.WaitRunTicks(1);
        }
    }

    public void Kill()
    {
        State = PairState.Dead;
        Server.Dispose();
        Client.Dispose();
    }

    private void ClearContext()
    {
        _testOut = default!;
        ServerLogHandler.ClearContext();
        ClientLogHandler.ClearContext();
    }

    public void ActivateContext(TextWriter testOut)
    {
        _testOut = testOut;
        ServerLogHandler.ActivateContext(testOut);
        ClientLogHandler.ActivateContext(testOut);
    }

    public void Use()
    {
        if (State != PairState.Ready)
            throw new InvalidOperationException($"Pair is not ready to use. State: {State}");
        State = PairState.InUse;
    }

    public enum PairState : byte
    {
        Ready = 0,
        InUse = 1,
        CleanDisposed = 2,
        Dead = 3,
    }
}