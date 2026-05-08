using System;
using System.CommandLine;
using System.IO;
using OpenDreamShared.EngineUtils;

namespace OpenDreamShared;

public static class OpenDreamConfig {

    private static ParseResult? parseResult; //access before Parse() should be a hard error anyway

    public static void Parse(string[] args) {
        RootCommand rootCommand = new("OpenDream Server");

        rootCommand.Options.Add(optionJsonPath);
        rootCommand.Options.Add(optionAlwaysShowExceptions);
        rootCommand.Options.Add(optionDebugAdapterLaunched);
        rootCommand.Options.Add(optionWorldParams);
        rootCommand.Options.Add(optionTopicPort);
        rootCommand.Options.Add(optionListPoolThreshold);
        rootCommand.Options.Add(optionListPoolSize);
        rootCommand.Options.Add(optionTracyEnable);
        rootCommand.Options.Add(optionInfoLinksDiscord);
        rootCommand.Options.Add(optionInfoLinksForum);
        rootCommand.Options.Add(optionInfoLinksGithub);
        rootCommand.Options.Add(optionInfoLinksWebsite);
        rootCommand.Options.Add(optionInfoLinksWiki);

        parseResult = rootCommand.Parse(args);
        if(parseResult.Errors.Count > 0){
            var _sawmill = Logger.GetSawmill("ArgumentParser");
            foreach(var parseResultError in parseResult.Errors)
                _sawmill.Error(parseResultError.Message);
            throw new ArgumentException($"{parseResult.Errors.Count} error(s) occurred while parsing args.");
        }
    }

    public static void OverrideDefault() {

    }

    private static readonly Option<string> optionJsonPath = new("opendream.json_path") {
        Description = "The compiled JSON file containing the OpenDream bytecode.",
        Required = true
    };

    public static string JsonPath => parseResult?.GetValue(optionJsonPath) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    private static readonly Option<bool> optionAlwaysShowExceptions = new("opendream.always_show_exceptions") {
        Description = "Whether OpenDream should always show exceptions.",
        DefaultValueFactory = (_) => false,
        Required = false
    };
    public static bool AlwaysShowExceptions => parseResult?.GetValue(optionAlwaysShowExceptions) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    private static readonly Option<int> optionDebugAdapterLaunched = new("opendream.debug_adapter_launched") {
        Description = "Whether this server was launched by the debug adapter.",
        DefaultValueFactory = (_) => 0,
        Required = false
    };
    public static int DebugAdapterLaunched => parseResult?.GetValue(optionDebugAdapterLaunched) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    private static readonly Option<string> optionWorldParams = new("opendream.world_params") {
        Description = "The parameters to pass to /world",
        DefaultValueFactory = (_) => string.Empty,
        Required = false
    };
    public static string WorldParams => parseResult?.GetValue(optionWorldParams) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    private static readonly Option<ushort> optionTopicPort = new("opendream.topic_port") {
        Description = "The port to host /world.Topic() on.",
        DefaultValueFactory = (_) => 25567,
        Required = false
    };
    public static ushort TopicPort => parseResult?.GetValue(optionTopicPort) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// How large a /list's capacity has to be before it will be held in the list pool
    /// </summary>
    private static readonly Option<int> optionListPoolThreshold = new("opendream.list_pool_threshold") {
        Description = "How large a /list's capacity has to be before it will be held in the list pool.",
        DefaultValueFactory = (_) => 2048,
        Required = false
    };
    public static int ListPoolThreshold => parseResult?.GetValue(optionListPoolThreshold) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// The maximum amount of lists kept in the list pool
    /// </summary>
    private static readonly Option<int> optionListPoolSize = new("opendream.list_pool_size") {
        Description = "The maximum amount of lists kept in the list pool.",
        DefaultValueFactory = (_) => 256,
        Required = false
    };
    public static int ListPoolSize => parseResult?.GetValue(optionListPoolSize) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// If Tracy should be enabled. ONLY FUNCTIONS IN TOOLS BUILD.
    /// </summary>
    private static readonly Option<bool> optionTracyEnable = new("opendream.enable_tracy") {
        Description = "If Tracy should be enabled. ONLY FUNCTIONS IN TOOLS BUILD.",
        DefaultValueFactory = (_) => false,
        Required = false
    };
    public static bool TracyEnable => parseResult?.GetValue(optionTracyEnable) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /*
    * INFOLINKS
    */

    /// <summary>
    /// Link to Discord server to show in the launcher.
    /// </summary>
    private static readonly Option<string> optionInfoLinksDiscord = new("infolinks.discord") {
        Description = "Link to Discord server to show in the launcher.",
        DefaultValueFactory = (_) => string.Empty,
        Required = false
    };
    public static string InfoLinksDiscord  => parseResult?.GetValue(optionInfoLinksDiscord) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// Link to forum to show in the launcher.
    /// </summary>
    private static readonly Option<string> optionInfoLinksForum = new("infolinks.forum") {
        Description = "Link to forum to show in the launcher.",
        DefaultValueFactory = (_) => string.Empty,
        Required = false
    };
    public static string InfoLinksForum => parseResult?.GetValue(optionInfoLinksForum) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// Link to GitHub page to show in the launcher.
    /// </summary>
    private static readonly Option<string> optionInfoLinksGithub = new("infolinks.github") {
        Description = "Link to GitHub page to show in the launcher.",
        DefaultValueFactory = (_) => string.Empty,
        Required = false
    };
    public static string InfoLinksGithub => parseResult?.GetValue(optionInfoLinksGithub) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// Link to website to show in the launcher.
    /// </summary>
    private static readonly Option<string> optionInfoLinksWebsite = new("infolinks.website") {
        Description = "Link to website to show in the launcher.",
        DefaultValueFactory = (_) => string.Empty,
        Required = false
    };
    public static string InfoLinksWebsite => parseResult?.GetValue(optionInfoLinksWebsite) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// Link to wiki to show in the launcher.
    /// </summary>
    private static readonly Option<string> optionInfoLinksWiki = new("infolinks.wiki") {
        Description = "Link to wiki to show in the launcher.",
        DefaultValueFactory = (_) => string.Empty,
        Required = false
    };
    public static string InfoLinksWiki => parseResult?.GetValue(optionInfoLinksWiki) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// Bind server to address
    /// </summary>
    private static readonly Option<string> optionNetBindTo = new("opendream.netbindto") {
        Description = "IP address to bind the server to.",
        DefaultValueFactory = (_) => string.Empty,
        Required = false
    };
    public static string NetBindTo => parseResult?.GetValue(optionNetBindTo) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

    /// <summary>
    /// Pause game automatically when server is empty
    /// </summary>
    private static readonly Option<bool> optionGameAutoPauseEmpty = new("opendream.gameautopauseempty") {
        Description = "Pause game automatically when server is empty.",
        DefaultValueFactory = (_) => false,
        Required = false
    };
    public static bool GameAutoPauseEmpty => parseResult?.GetValue(optionGameAutoPauseEmpty) ?? throw new InvalidDataException("Could not get arg value, did parse fail?");

}
