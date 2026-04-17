using System;

namespace OpenDreamShared.EngineUtils;

public static class Logger {

    public static ISawmill GetSawmill(string name) {
        return new ConsoleLog();
    }
}


class ConsoleLog : ISawmill {
    public void Log(LogLevel logLevel, string message) {
        Console.WriteLine(message);
    }
}

public interface ISawmill {
    public void Log(LogLevel logLevel, string message);
    public void Debug(string message) { Log(LogLevel.Debug, message); }
    public void Info(string message) { Log(LogLevel.Info, message); }
    public void Warning(string message) { Log(LogLevel.Warning, message); }
    public void Error(string message) { Log(LogLevel.Error, message); }
    public void Critical(string message) { Log(LogLevel.Critical, message); }
}

public enum LogLevel {
    Debug,
    Info,
    Warning,
    Error,
    Critical,
}
