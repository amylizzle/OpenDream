public interface IPlayerManager {
    public void SetAttachedEntity(ICommonSession session, Entity entity);
}

public enum SessionStatus {
    Connected,
    InGame,
    Disconnected,
}

public interface ICommonSession {

}

public class PlayerManger : IPlayerManager {
    public void SetAttachedEntity(ICommonSession session, Entity entity) {
        throw new System.NotImplementedException();
    }
}
