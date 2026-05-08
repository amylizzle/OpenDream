using OpenDreamShared.EngineUtils;
using OpenDreamShared.Interface.Descriptors;
using OpenDreamShared.Interface.DMF;


namespace OpenDreamRuntime.Resources;

public sealed class DMFResource : DreamResource {
    public DMFResource(int id, byte[] data) : base(id, data) {
        ParseAndLoadResources();
    }

    public DMFResource(int id, string? filePath, string? resourcePath) : base(id, filePath, resourcePath) {
        ParseAndLoadResources();
    }

    private void ParseAndLoadResources() {
        //parse and extract resources, loading them into the cache
        var lexer = new DMFLexer(ReadAsString() ?? "");
        var parser = new DMFParser(lexer);
        InterfaceDescriptor interfaceDescriptor = parser.Interface();

        if (parser.Errors.Count > 0) {
            var sawmill = Logger.GetSawmill("opendream.interface");
            foreach (string error in parser.Errors) {
                sawmill.Error(error);
            }
        }

        foreach (WindowDescriptor windowDescriptor in interfaceDescriptor.WindowDescriptors) {
            foreach (ControlDescriptor controlDescriptor in windowDescriptor.ControlDescriptors) {
                if (controlDescriptor is ControlDescriptorButton button) {
                    if (!string.IsNullOrEmpty(button.Image.AsRaw())) {
                        //we must queue these rather than load them directly, because otherwise IDs are wrong
                        //can't load a resource in the middle of loading a resource
                        IoCManager.Resolve<DreamResourceManager>().QueueResourceLoad(button.Image.AsRaw().Replace("\\","/"));
                    }
                }
            }
        }
    }
}
