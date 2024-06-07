using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using NUnit.Framework;
using NUnit.Framework.Interfaces;
using OpenDreamRuntime;
using OpenDreamRuntime.Objects;
using OpenDreamShared;
using Robust.Shared.Asynchronous;
using Robust.Shared.IoC;
using Robust.Shared.Timing;

namespace Content.IntegrationTests {

    [Flags]
    public enum DMTestFlags {
        NoError = 0,        // Should run without errors
        Ignore = 1,         // Ignore entirely
        CompileError = 2,   // Should fail to compile
        RuntimeError = 4,   // Should throw an exception at runtime
        ReturnTrue = 8,     // Should return TRUE
        NoReturn = 16,      // Shouldn't return (aka stopped by a stack-overflow or runtimes)
    }
    [TestFixture]
    public sealed class GameTests : ContentIntegrationTest {
        private const string TestsDirectory = "IntegrationTests";
        private const string TestProject = "DMProject";
        private static string InitializeEnvironment = "environment.dme";
        private static string CompilerPath = "DMCompiler";
        private static string TestsPath = "";

        static GameTests(){
            //set up absolute paths to make it easier to point to things
            //starting directory *should* be bin/Content.IntegrationTests/
            CompilerPath = Path.Join(Directory.GetCurrentDirectory(), "DMCompiler");
            InitializeEnvironment = Path.Join(Directory.GetCurrentDirectory(), TestProject, InitializeEnvironment);
            TestsPath = Path.Join(Directory.GetCurrentDirectory(), TestProject, TestsDirectory);
        }

        [Dependency] private readonly ITaskManager _taskManager = default!;

        /// <summary>
        /// Test to make sure the IntegrationTest project does not runtime.
        /// </summary>
        [Test]
        public async Task NoRuntimesTest() {
            string? compiledFile = Compile(string.Empty);
            if (compiledFile is null) {
                Assert.Fail($"Failed to compile {InitializeEnvironment}");
            }
            PoolSettings settings = new() {
                    JsonPath = compiledFile!,
                    Dirty = true,
                    NoLoadContent = false,
                };
            await using var pair = await PoolManager.GetServerClient(settings);
            var client = pair.Client;
            var server = pair.Server;
            //ServerIntegrationOptions options = new();
            //options.CVarOverrides[OpenDreamCVars.JsonPath.Name] = compiledFile!;
            //var (client, server) = await StartConnectedServerClientPair(serverOptions:options);

            await RunTicksSync(client, server, 1000);
            Assert.That(server.IsAlive);
            var manager = server.ResolveDependency<DreamManager>();
            if(manager.LastDMException is not null) {
                Assert.Fail($"Runtime occurred on server boot: {manager.LastDMException}");
            }
        }


        /// <summary>
        /// Get the filenames of the DM tests
        /// </summary>
        private static IEnumerable<object[]> GetTests() {
            foreach (string sourceFile in Directory.GetFiles(TestsPath, "*.dm", SearchOption.AllDirectories)) {
                string sourceFile2 = sourceFile[$"{TestsPath}/".Length..];
                DMTestFlags testFlags = GetDMTestFlags(sourceFile);
                if (testFlags.HasFlag(DMTestFlags.Ignore))
                    continue;

                yield return new object[] {
                    sourceFile2,
                    testFlags
                };
            }
        }

        /// <summary>
        /// Parse the test flags from the file
        /// </summary>
        private static DMTestFlags GetDMTestFlags(string sourceFile) {
            DMTestFlags testFlags = DMTestFlags.NoError;

            using (StreamReader reader = new StreamReader(sourceFile)) {
                string? firstLine = reader.ReadLine();
                if (firstLine == null)
                    return testFlags;
                if (firstLine.Contains("IGNORE", StringComparison.InvariantCulture))
                    testFlags |= DMTestFlags.Ignore;
                if (firstLine.Contains("COMPILE ERROR", StringComparison.InvariantCulture))
                    testFlags |= DMTestFlags.CompileError;
                if (firstLine.Contains("RUNTIME ERROR", StringComparison.InvariantCulture))
                    testFlags |= DMTestFlags.RuntimeError;
                if (firstLine.Contains("RETURN TRUE", StringComparison.InvariantCulture))
                    testFlags |= DMTestFlags.ReturnTrue;
                if (firstLine.Contains("NO RETURN", StringComparison.InvariantCulture))
                    testFlags |= DMTestFlags.NoReturn;
            }

            return testFlags;
        }

        /// <summary>
        /// Compile the test code and return the path to the JSON, or null if it failed to compile
        /// </summary>
        private static string? Compile(string sourceFile) {

            System.Diagnostics.Process compileProcess = new System.Diagnostics.Process();

            //settings up parameters for the install process
            compileProcess.StartInfo.FileName = CompilerPath;
            if(string.IsNullOrEmpty(sourceFile))
                compileProcess.StartInfo.Arguments = $"{InitializeEnvironment}";
            else
                compileProcess.StartInfo.Arguments = $"{InitializeEnvironment} {sourceFile} --output={Path.ChangeExtension(sourceFile, "json")}";
            compileProcess.StartInfo.RedirectStandardOutput = true;
            compileProcess.StartInfo.RedirectStandardError = true;
            compileProcess.Start();

            compileProcess.WaitForExit();
            // Check for sucessful completion
            bool successfulCompile = (compileProcess.ExitCode == 0) ? true : false;
            string output = compileProcess.StandardOutput.ReadToEnd();
            TestContext.WriteLine(output);
            return successfulCompile ? Path.ChangeExtension(sourceFile, "json") : null;
        }

        /// <summary>
        /// Delete the passed file
        /// </summary>
        private static void Cleanup(string? compiledFile) {
            if (!File.Exists(compiledFile))
                return;

            File.Delete(compiledFile);
        }


        /// <summary>
        /// Actually run the DM tests
        /// </summary>
        //[Test, TestCaseSource(nameof(GetTests))]
        public async Task TestFiles(string sourceFile, DMTestFlags testFlags) {
            string initialDirectory = Directory.GetCurrentDirectory();
            TestContext.WriteLine($"--- TEST {sourceFile} | Flags: {testFlags}");

            try {
                string? compiledFile = Compile(Path.Join(initialDirectory, TestsDirectory, sourceFile));
                if (testFlags.HasFlag(DMTestFlags.CompileError)) {
                    Assert.That(compiledFile, Is.Null, "Expected an error during DM compilation");
                    Cleanup(compiledFile);
                    TestContext.WriteLine($"--- PASS {sourceFile}");
                    return;
                }
                Assert.That(compiledFile is not null && File.Exists(compiledFile), "Failed to compile DM source file");
                PoolSettings settings = new() {
                    JsonPath = compiledFile!,
                    Dirty = true
                };
                await using var pair = await PoolManager.GetServerClient(settings);



                var dreamManager = pair.Server.ResolveDependency<DreamManager>();
                Assert.That(dreamManager, Is.Not.Null, "DreamManager is null");

                //Assert.That(dreamManager.LoadJson(compiledFile), $"Failed to load {compiledFile}");
                //dreamManager.PreInitialize(compiledFile);
                //dreamManager.StartWorld();
                await RunTicksSync(pair.Client, pair.Server, 1000);
                (bool successfulRun, DreamValue? returned, Exception? exception) = await RunTest(dreamManager);

                if (testFlags.HasFlag(DMTestFlags.NoReturn)) {
                    Assert.That(returned.HasValue, Is.False, "proc returned unexpectedly");
                } else {
                    Assert.That(returned.HasValue, "proc did not return (did it hit an exception?)");
                }

                if (testFlags.HasFlag(DMTestFlags.RuntimeError)) {
                    Assert.That(successfulRun, Is.False, "A DM runtime exception was expected");
                } else {
                    if (exception != null)
                        Assert.That(successfulRun, $"A DM runtime exception was thrown: \"{exception}\"");
                    else
                        Assert.That(successfulRun, "A DM runtime exception was thrown, and its message could not be recovered!");
                }

                if (testFlags.HasFlag(DMTestFlags.ReturnTrue)) {
                    Assert.That(returned?.IsTruthy(), Is.True, "Test was expected to return TRUE");
                }

                Cleanup(compiledFile);
                TestContext.WriteLine($"--- PASS {sourceFile}");
                await pair.CleanReturnAsync();
            } finally {
                // Restore the original CurrentDirectory, since loading a compiled JSON changes it.
                Directory.SetCurrentDirectory(initialDirectory);


            }
        }

        private async Task<(bool Success, DreamValue? Returned, Exception? except)> RunTest(DreamManager dreamManager) {
            var prev = dreamManager.LastDMException;

            DreamValue? retValue = null;
            Task<DreamValue> callTask = null!;

            DreamThread.Run("RunTest", async (state) => {
                if (dreamManager.TryGetGlobalProc("RunTest", out DreamProc? proc)) {
                    callTask = state.Call(proc, null, null);
                    retValue = await callTask;
                    return DreamValue.Null;
                } else {
                    Assert.Fail("No global proc named RunTest");
                    return DreamValue.Null;
                }
            });

            var watch = new Stopwatch();
            watch.Start();

            // Tick until our inner call has finished
            while (!callTask.IsCompleted) {
                dreamManager.Update();
                _taskManager.ProcessPendingTasks();

                if (watch.Elapsed.TotalMilliseconds > 500) {
                    Assert.Fail("Test timed out");
                }
            }

            bool retSuccess = dreamManager.LastDMException == prev; // Works because "null == null" is true in this language.
            return (retSuccess, retValue, dreamManager.LastDMException);
        }
    }
}
