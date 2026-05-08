
namespace OpenDreamShared.EngineUtils;

public struct MapCoordinates(uint X, uint Y, uint Z) {
    public uint X = X;
    public uint Y = Y;
    public uint Z = Z;

    public Vector2i XY = new Vector2i((int)X, (int)Y);
}

public static class MapId {
    public static readonly uint Nullspace = 0;
}
