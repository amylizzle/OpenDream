using OpenDreamShared.Dream;
using Robust.Client.Graphics;
using OpenDreamClient.Rendering.Particles;
using System.Globalization;
using YamlDotNet.Core.Tokens;
using OpenDreamShared.Rendering;

namespace OpenDreamClient.Rendering;

internal sealed class RendererMetaData : IComparable<RendererMetaData> {
    public DreamIcon? MainIcon;
    public ImmutableAppearance? BaseAppearance;
    public Vector2 Position;
    public int Plane; //true plane value may be different from appearance plane value, due to special flags
    public float Layer; //ditto for layer
    public EntityUid Uid;
    public EntityUid ClickUid; //the UID of the object clicks on this should be passed to (ie, for overlays)
    public bool IsScreen;
    public int TieBreaker; //Used for biasing render order (ie, for overlays)
    public Color ColorToApply;
    public ColorMatrix ColorMatrixToApply;
    public float AlphaToApply;
    public Matrix3x2 TransformToApply;
    public string? RenderSource;
    public string? RenderTarget;
    public List<RendererMetaData>? KeepTogetherGroup;
    public List<RendererMetaData>? Overlays;
    public List<RendererMetaData>? Underlays;
    public List<RendererMetaData>? VisContents;
    public AppearanceFlags AppearanceFlags;
    public BlendMode BlendMode;
    public MouseOpacity MouseOpacity;
    public Texture? TextureOverride;
    public string? Maptext;
    public Vector2i? MaptextSize;
    public ParticleSystem? Particles;
    public ClientAppearanceSystem.Flick? Flick;

    public bool IsPlaneMaster => (AppearanceFlags & AppearanceFlags.PlaneMaster) != 0;
    public bool HasRenderSource => !string.IsNullOrEmpty(RenderSource);
    public bool ShouldPassMouse => HasRenderSource && (AppearanceFlags & AppearanceFlags.PassMouse) != 0;

    public RendererMetaData() {
        Reset();
    }

    public void Reset() {
        MainIcon = null;
        BaseAppearance = null;
        Position = Vector2.Zero;
        Plane = 0;
        Layer = 0;
        Uid = EntityUid.Invalid;
        ClickUid = EntityUid.Invalid;
        IsScreen = false;
        TieBreaker = 0;
        ColorToApply = Color.White;
        ColorMatrixToApply = ColorMatrix.Identity;
        AlphaToApply = 1.0f;
        TransformToApply = Matrix3x2.Identity;
        RenderSource = "";
        RenderTarget = "";
        KeepTogetherGroup = null; //don't actually need to allocate this 90% of the time
        AppearanceFlags = AppearanceFlags.None;
        BlendMode = BlendMode.Default;
        MouseOpacity = MouseOpacity.Transparent;
        TextureOverride = null;
        Maptext = null;
        MaptextSize = null;
        Particles = null;
    }

    public FastRenderData asFastRenderData(DreamViewOverlay viewOverlay, DrawingHandleWorld handle, Vector2 position) {
        return new(this) {
            Texture = GetTexture(viewOverlay, handle),
            Position = position,
        };
    }

    public Texture? GetTexture(DreamViewOverlay viewOverlay, DrawingHandleWorld handle) {
        if (TextureOverride is not null)
            return TextureOverride; //we already generated the maptext texture or this is a plane master or it's KT group we already processed

        if (MainIcon is null) {
            //Maptext - things with icons can have maptext set, but the sprite tree will separate it out into a null icon + maptext
            if (!string.IsNullOrWhiteSpace(Maptext)) {

                //otherwise gen it and store it
                var maptextSize = MaptextSize!.Value;
                if (maptextSize.X == 0)
                    maptextSize.X = 32;
                if (maptextSize.Y == 0)
                    maptextSize.Y = 32;

                var renderTarget = viewOverlay._renderTargetPool.Rent(maptextSize);
                viewOverlay._mapTextRenderer.RenderToTarget(handle, renderTarget, Maptext);
                viewOverlay._renderTargetPool.ReturnAtEndOfFrame(renderTarget);
                TextureOverride = renderTarget.Texture;
                return TextureOverride;
            } else
                return null; //no icon, no maptext
        }
        //KEEP_TOGETHER groups
        if (KeepTogetherGroup?.Count > 0) {
            // TODO: Calculate an appropriate size based on overlays/underlays, offsets and transforms.
            // For now, just generate a buffer of 128 pixels around the main icon...
            Vector2i ktSize = (256, 256) + MainIcon.DMI?.IconSize ?? (0, 0);
            TextureOverride = viewOverlay.ProcessKeepTogether(handle, this, ktSize);
            Position -= ((ktSize / viewOverlay.IconSize) - Vector2.One) * new Vector2(0.5f); //correct for KT group texture offset
        }

        var texture = MainIcon.GetTexture(viewOverlay, handle, this, TextureOverride, Flick);
        MainIcon.LastRenderedTexture = texture;
        return texture;

    }

    public int CompareTo(RendererMetaData? other) {
        if (other == null)
            return 1;

        //Render target and source ordering is done first.
        //Anything with a render target goes first because they get rendered offscreen
        int val = (!string.IsNullOrEmpty(RenderTarget)).CompareTo(!string.IsNullOrEmpty(other.RenderTarget));
        if (val != 0) {
            return -val;
        }

        //Anything with a render source which points to a render target must come *after* that render_target
        if (HasRenderSource && RenderSource == other.RenderTarget) {
            return 1;
        }

        //We now return to your regularly scheduled sprite render order

        //Plane
        val = Plane.CompareTo(other.Plane);
        if (val != 0) {
            return val;
        }

        //Plane master objects go first for any given plane
        val = IsPlaneMaster.CompareTo(IsPlaneMaster);
        if (val != 0) {
            return -val; //sign flip because we want 1 < -1
        }

        //sub-plane (ie, HUD vs not HUD)
        val = IsScreen.CompareTo(other.IsScreen);
        if (val != 0) {
            return val;
        }

        //depending on world.map_format, either layer or physical position
        //TODO
        val = Layer.CompareTo(other.Layer);
        if (val != 0) {
            return val;
        }

        //Finally, tie-breaker - in BYOND, this is order of creation of the sprites
        //for us, we use EntityUID, with a tie-breaker (for underlays/overlays)
        val = Uid.CompareTo(other.Uid);
        if (val != 0) {
            return val;
        }

        //FLOAT_LAYER must be sorted local to the thing they're floating on, and since all overlays/underlays share their parent's UID, we
        //can do that here.
        if (MainIcon?.Appearance?.Layer < -1 && other.MainIcon?.Appearance?.Layer < -1) { //if these are FLOAT_LAYER, sort amongst them
            val = MainIcon.Appearance.Layer.CompareTo(other.MainIcon.Appearance.Layer);
            if (val != 0) {
                return val;
            }
        }

        // All else being the same, group them by icon.
        // This allows Clyde to batch the draw calls more efficiently.
        val = (MainIcon?.Appearance?.Icon ?? 0) - (other.MainIcon?.Appearance?.Icon ?? 0);
        if (val != 0) {
            return val;
        }

        return TieBreaker.CompareTo(other.TieBreaker);
    }

    public UInt64 GetSortKey() {
        // we bit bashin now boyos
        UInt64 key = 0;
        //lower number = processed first

        //Plane master objects go first for any given plane
        if (!IsPlaneMaster) key |= 1UL << 63;

        //sub-plane (ie, HUD vs not HUD)
        if (IsScreen) key |= 1UL << 62;

        //TODO depending on world.map_format, either layer or physical position
        // clamp to possible values
        float clamped = Math.Clamp(Layer, -20000.0f, 20000.0f);

        // normalize to [0, 40000]
        float normalized = (clamped + 20000.0f) / 40000.0f;

        // 3. Map to a 24-bit integer (Max value is 0xFFFFFF or 16,777,215)
        // Adding 0.5f before casting to uint handles rounding to the nearest integer
        uint quantized = (uint)(normalized * 16777215.0f + 0.5f);
        key |= (ulong)quantized << 38;

        //Finally, tie-breaker - in BYOND, this is order of creation of the sprites
        //for us, we use EntityUID, with a tie-breaker (for underlays/overlays)
        // val = Uid.CompareTo(other.Uid);
        // if (val != 0) {
        //     return val;
        // }

        //FLOAT_LAYER must be sorted local to the thing they're floating on, and since all overlays/underlays share their parent's UID, we
        //can do that here.
        if (MainIcon?.Appearance?.Layer < -1) { //if these are FLOAT_LAYER, sort amongst them
            clamped = -1.0f * Math.Clamp(Layer, -20000.0f, -1.0f);

            // normalize to [0, 20000]
            normalized = clamped / 20000.0f;

            // 3. Map to a 16-bit integer (Max value is 0xFFFF)
            // Adding 0.5f before casting to uint handles rounding to the nearest integer
            quantized = (uint)(normalized * 65535.0 + 0.5f);
            key |= (ulong)quantized << 22;
        }

        // All else being the same, group them by icon.
        // This allows Clyde to batch the draw calls more efficiently.
        // IconID (12 bits)
        uint maskedIcon = (uint)Math.Clamp(MainIcon?.Appearance?.Icon ?? 0, 0, 4095);
        key |= (ulong)maskedIcon << 12;

        // TieBreaker (8 bits)
        uint maskedTie = (uint)Math.Clamp(TieBreaker, 0, 255);
        key |= (ulong)maskedTie;

        return key;
    }
}

struct FastRenderData(RendererMetaData metaData) : IComparable<FastRenderData> {
    public Texture? Texture;
    public Vector2 Position;
    public Vector2 TextureRenderOffset; //TODO this is never set
    private RendererMetaData rendererMeta = metaData;

    //convenience
    public ColorMatrix ColorMatrixToApply => rendererMeta.ColorMatrixToApply;
    public Color ColorToApply => rendererMeta.ColorToApply;
    public float AlphaToApply => rendererMeta.AlphaToApply;

    public Matrix3x2 TransformToApply => rendererMeta.TransformToApply;

    public bool IsPlaneMaster => rendererMeta.IsPlaneMaster;
    public ParticleSystem? Particles => rendererMeta.Particles;
    public BlendMode BlendMode => rendererMeta.BlendMode;

    public int CompareTo(FastRenderData other) {
        int val = rendererMeta.CompareTo(other.rendererMeta);
        if(val==0)
            val = Math.Sign(this.Position.X - other.Position.X);
        if(val==0)
            val = Math.Sign(this.Position.Y - other.Position.Y);
        return val;

    }
}
