public class NetworkSystem {

    public virtual void Initialize(){}
    public virtual void Shutdown(){}

    public void RaiseNetworkEvent(EntityEventArgs eventArgs) {}
    public void SubscribeLocalEvent(){}

}
