using OpenDreamShared.EngineUtils;
namespace OpenDreamShared.Network;
public interface INetManager {
    public void Init();
    public void RegisterNetMessage<T>(ProcessMessage<T>? callback = null) where T:NetMessage, new();
    public delegate void ProcessMessage<in T>(T message) where T : NetMessage;
    public delegate void ProcessMessage(NetMessage message);

    public void MarkDirty(Component c, string fieldName);
}
