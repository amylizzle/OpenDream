using System;

namespace OpenDreamShared.EngineUtils;

public static class Logger {

    public static ISawmill GetSawmill(string name) {
        return new ConsoleLog();
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
