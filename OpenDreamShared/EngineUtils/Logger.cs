using System;
using System.Collections.Generic;

namespace OpenDreamShared.EngineUtils;

public static class Logger {

    private static Dictionary<LogLevel, string> logLevelNameLookup = new(){
        {LogLevel.Debug, "Debug"},
        {LogLevel.Info, "Info"},
        {LogLevel.Warning, "Warning"},
        {LogLevel.Error, "Error"},
        {LogLevel.Fatal, "Fatal"}
    };

    public static ISawmill GetSawmill(string name) {
        return new ConsoleLog();
    }

    public static string LogLevelToName(LogLevel level) {
        return logLevelNameLookup.GetValueOrDefault(level, "Invalid Log Level");
    }
}


class ConsoleLog : ISawmill {
    public void Log(LogLevel logLevel, string message) {
        Console.WriteLine($"[{logLevel}] {message}");
    }

    public void Log(LogLevel logLevel, Exception e, string message) {
        Log(logLevel, $"Exception: {e.Message} - {message}");
    }
}

public interface ISawmill {
    public void Log(LogLevel logLevel, string message);
    public void Log(LogLevel logLevel, Exception e, string message);
    public void Debug(string message) { Log(LogLevel.Debug, message); }
    public void Info(string message) { Log(LogLevel.Info, message); }
    public void Warning(string message) { Log(LogLevel.Warning, message); }
    public void Error(string message) { Log(LogLevel.Error, message); }
    public void Fatal(string message) { Log(LogLevel.Fatal, message); }
}

public enum LogLevel {
    Debug,
    Info,
    Warning,
    Error,
    Fatal,
}
