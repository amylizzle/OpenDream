using System.Text.Json.Serialization;
using JetBrains.Annotations;

namespace OpenDreamRuntime.Procs.DebugAdapter.Protocol;


public class ProtocolMessage {
    [JsonPropertyName("seq")] public int Seq { get; set; }
    [JsonPropertyName("type")] public string Type { get; set; } = null!;

    [UsedImplicitly]
    public ProtocolMessage() { }

    protected ProtocolMessage(string type) {
        Type = type;
    }
}
