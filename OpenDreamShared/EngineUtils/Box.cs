namespace OpenDreamShared.EngineUtils;

public struct Box2i {
    public Vector2i TopLeft;
    public Vector2i BottomRight;
    public int Top { get => TopLeft.Y; set => TopLeft.Y = value;}
    public int Left { get => TopLeft.X; set => TopLeft.X = value;}
    public int Bottom { get => BottomRight.Y; set => BottomRight.Y = value;}
    public int Right { get => BottomRight.X; set => BottomRight.X = value;}
    public int Width { get => Right - Left; }
    public int Height { get => Bottom - Top; }

    public Box2i(Vector2i TopLeft, Vector2i BottomRight) {
        this.TopLeft = TopLeft;
        this.BottomRight = BottomRight;
    }

    public static Box2i FromDimensions(int X, int Y, int Width, int Height) {
        return new(new(X,Y), new(X+Width, Y+Height));
    }

}
