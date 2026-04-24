using System.Text.Json.Nodes;
using OpenDreamShared;



namespace OpenDreamRuntime;

/// <summary>
/// Adds additional data like info links to the server info endpoint
/// </summary>
public sealed class ServerInfoManager {
    private static readonly (CVarDef<string> cVar, string icon, string name)[] Vars = {
        // @formatter:off
        (OpenDreamConfig.InfoLinksDiscord, "discord", "Discord"),
        (OpenDreamConfig.InfoLinksForum,   "forum",   "Forum"),
        (OpenDreamConfig.InfoLinksGithub,  "github",  "GitHub"),
        (OpenDreamConfig.InfoLinksWebsite, "web",     "Website"),
        (OpenDreamConfig.InfoLinksWiki,    "wiki",    "Wiki")
        // @formatter:on
    };

    private readonly IStatusHost _statusHost = IoCManager.Resolve<IStatusHost>();
    private readonly IConfigurationManager _cfg = IoCManager.Resolve<IConfigurationManager>();

    public void Initialize() {
        _statusHost.OnInfoRequest += OnInfoRequest;
    }

    private void OnInfoRequest(JsonNode json) {
        foreach (var (cVar, icon, name) in Vars) {
            var url = _cfg.GetCVar(cVar);
            if (string.IsNullOrEmpty(url))
                continue;

            StatusHostHelpers.AddLink(json, name, url, icon);
        }
    }
}
