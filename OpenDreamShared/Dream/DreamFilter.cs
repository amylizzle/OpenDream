

using System;
using System.Numerics;
using OpenDreamShared.EngineUtils;


namespace OpenDreamShared.Dream;

/// <summary>
/// An object describing type and vars so the client doesn't have to make a ShaderInstance for shaders with the same params
/// </summary>
[Serializable, NetSerializable, ImplicitDataDefinitionForInheritors]
public partial record DreamFilter {
    /// <summary>
    /// Indicates this filter was used in the last render cycle, for shader caching purposes
    /// </summary>
    public bool Used = false;

    [DataField("type")]
    public string FilterType;

    [DataField("name")]
    public string? FilterName;

    public static Type? GetType(string filterType) {
        return filterType switch {
            "alpha" => typeof(DreamFilterAlpha),
            "angular_blur" => typeof(DreamFilterAngularBlur),
            "bloom" => typeof(DreamFilterBloom),
            "blur" => typeof(DreamFilterBlur),
            "color" => typeof(DreamFilterColor),
            "displace" => typeof(DreamFilterDisplace),
            "drop_shadow" => typeof(DreamFilterDropShadow),
            "layer" => typeof(DreamFilterLayer),
            "motion_blur" => typeof(DreamFilterMotionBlur),
            "outline" => typeof(DreamFilterOutline),
            "radial_blur" => typeof(DreamFilterRadialBlur),
            "rays" => typeof(DreamFilterRays),
            "ripple" => typeof(DreamFilterRipple),
            "wave" => typeof(DreamFilterWave),
            "greyscale" => typeof(DreamFilterGreyscale),
            _ => null
        };
    }

    /// <summary>
    /// Calculate the size of the texture necessary to render this filter
    /// </summary>
    /// <param name="baseSize">The size of the object the filter is being applied to</param>
    /// <param name="textureSizeCallback">A callback that returns the size of a given render source</param>
    public Vector2i CalculateRequiredRenderSpace(Vector2i baseSize, Func<string, Vector2i> textureSizeCallback) {
        Vector2 requiredSpace = baseSize;

        // All the "* 2" in here is because everything is rendered in the center,
        // So every increase in size needs applied to both sides
        switch (this) {
            case DreamFilterAlpha alpha:
                requiredSpace += Vector2.Abs(new(alpha.X, alpha.Y)) * 2;

                if (!string.IsNullOrEmpty(alpha.RenderSource)) {
                    var textureSize = textureSizeCallback(alpha.RenderSource);
                    requiredSpace = Vector2.Max(requiredSpace, textureSize);
                } else if (alpha.Icon != 0) {
                    // TODO
                }

                break;
            case DreamFilterBlur blur:
                requiredSpace += new Vector2(blur.Size) * 2;
                break;
            case DreamFilterDropShadow dropShadow:
                if (dropShadow.Size - dropShadow.X > 0)
                    requiredSpace.X += (dropShadow.Size + dropShadow.X) * 2;

                if (dropShadow.Size - dropShadow.Y > 0)
                    requiredSpace.Y += (dropShadow.Size + dropShadow.Y) * 2;
                break;
            case DreamFilterOutline outline:
                requiredSpace += new Vector2(outline.Size) * 2;
                break;
        }

        return (Vector2i)requiredSpace;
    }
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterAlpha : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("icon")] public int Icon; // Icon resource ID
    [DataField("render_source")] public string RenderSource = ""; // String that gets special processing in the render loop
    [DataField("flags")] public short Flags;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterAngularBlur : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("size")] public float Size = 1f;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterBloom : DreamFilter {
    [DataField("threshold")] public Color Threshold = Color.Black;
    [DataField("size")] public float Size = 1f;
    [DataField("offset")] public float Offset = 1f;
    [DataField("alpha")] public float Alpha = 255f;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterBlur : DreamFilter {
    [DataField("size")] public float Size = 1f;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterColor : DreamFilter {
    [DataField("color", required: true)] public ColorMatrix Color;
    [DataField("space")] public float Space; // Default is FILTER_COLOR_RGB = 0
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterDisplace : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("size")] public float Size = 1f;
    [DataField("icon")] public int Icon; // Icon resource ID
    [DataField("render_source")] public string RenderSource = ""; // String that will require special processing
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterDropShadow : DreamFilter {
    [DataField("x")] public float X = 1f;
    [DataField("y")] public float Y = -1f;
    [DataField("size")] public float Size = 1f;
    [DataField("offset")] public float Offset;
    [DataField("color")] public Color Color = Color.Black.WithAlpha(128);
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterLayer : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("icon")] public int Icon; // Icon resource ID
    [DataField("render_source")] public string RenderSource = ""; // String that will require special processing
    [DataField("flags")] public float Flags; // Default is FILTER_OVERLAY = 0
    [DataField("color")] public Color Color = Color.Black.WithAlpha(128); // Shit needs to be string or color matrix, because of course one has to be special
    [DataField("transform")] public Matrix3x2 Transform = Matrix3x2.Identity;
    [DataField("blend_mode")] public float BlendMode;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterMotionBlur : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterOutline : DreamFilter {
    [DataField("size")] public float Size = 1f;
    [DataField("color")] public Color Color = Color.Black;
    [DataField("flags")] public float Flags;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterRadialBlur : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("size")] public float Size = 0.01f;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterRays : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("size")] public float Size = 16f; // Defaults to half tile width
    [DataField("color")] public Color Color = Color.White;
    [DataField("offset")] public float Offset;
    [DataField("density")] public float Density = 10f;
    [DataField("threshold")] public float Threshold = 0.5f;
    [DataField("factor")] public float Factor;
    [DataField("flags")] public float Flags = 3f; // Defaults to FILTER_OVERLAY | FILTER_UNDERLAY
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterRipple : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("size")] public float Size = 1f;
    [DataField("repeat")] public float Repeat = 2f;
    [DataField("radius")] public float Radius;
    [DataField("falloff")] public float Falloff = 1f;
    [DataField("flags")] public float Flags;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterWave : DreamFilter {
    [DataField("x")] public float X;
    [DataField("y")] public float Y;
    [DataField("size")] public float Size = 1f;
    [DataField("offset")] public float Offset;
    [DataField("flags")] public float Flags;
}

[Serializable, NetSerializable]
public sealed partial record DreamFilterGreyscale : DreamFilter;
