using System.Text.Json.Serialization;

namespace OpenDreamRuntime.Procs.DebugAdapter.Protocol;


public class ValueFormat {
    /**
     * Display the value in hex.
     */
    [JsonPropertyName("hex")] public bool? Hex { get; set; }
}
