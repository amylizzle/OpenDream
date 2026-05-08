
namespace OpenDreamShared.EngineUtils;

public struct MapCoordinates(int X, int Y, int Z) {
    public int X = X;
    public int Y = Y;
    public int Z = Z;
    public Vector2i XY = new Vector2i(X, Y);
}

public static class MapId {
    public static readonly int Nullspace = 0;
}
