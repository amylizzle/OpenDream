using System.Linq;
using OpenDreamClient.Interface;
using Robust.Client.Graphics;
using Robust.Client.Player;
using Robust.Shared.Map;
using OpenDreamShared.Dream;
using Robust.Shared.Console;
using Robust.Shared.Prototypes;
using OpenDreamShared.Rendering;
using OpenDreamClient.Rendering.Particles;
using Robust.Client.GameObjects;
using Robust.Shared.Map.Components;
using Robust.Shared.Profiling;
using Matrix3x2 = System.Numerics.Matrix3x2;
using Robust.Client.ResourceManagement;
using Robust.Client.UserInterface.RichText;
using Robust.Shared.Enums;

namespace OpenDreamClient.Rendering;

/// <summary>
/// Overlay for rendering world atoms
/// </summary>
internal sealed partial class DreamViewOverlay : Overlay {
    public static ShaderInstance ColorInstance = default!;

    public override OverlaySpace Space => OverlaySpace.WorldSpaceBelowWorld;

    public bool ScreenOverlayEnabled = true;
    public bool MouseMapRenderEnabled;

    public int IconSize => _interfaceManager.IconSize;
    public Texture? MouseMap => _mouseMapRenderTarget?.Texture;
    public readonly ShaderInstance BlockColorInstance;
    public readonly Dictionary<Color, RendererMetaData> MouseMapLookup = new();
    public readonly Dictionary<string, IRenderTexture> RenderSourceLookup = new();
    public readonly HashSet<EntityUid> EntitiesInView = new();

    private const LookupFlags MapLookupFlags = LookupFlags.Approximate | LookupFlags.Uncontained;

    [Dependency] private IDreamInterfaceManager _interfaceManager = default!;
    [Dependency] private IPlayerManager _playerManager = default!;
    [Dependency] private IEntityManager _entityManager = default!;
    [Dependency] private ParticlesManager _particlesManager = default!;
    [Dependency] private IEntitySystemManager _entitySystemManager = default!;
    [Dependency] private IMapManager _mapManager = default!;
    [Dependency] private IClyde _clyde = default!;
    [Dependency] private IPrototypeManager _protoManager = default!;
    [Dependency] private ProfManager _prof = default!;
    [Dependency] private IResourceCache _resourceCache = default!;
    [Dependency] private MarkupTagManager _tagManager = default!;

    private readonly ISawmill _sawmill = Logger.GetSawmill("opendream.view");

    private readonly TransformSystem _transformSystem;
    private readonly MapSystem _mapSystem;
    private readonly EntityLookupSystem _lookupSystem;
    private readonly ClientAppearanceSystem _appearanceSystem;
    private readonly ClientScreenOverlaySystem _screenOverlaySystem;
    private readonly ClientImagesSystem _imagesSystem;
    private readonly DMISpriteSystem _spriteSystem;

    private readonly EntityQuery<DMISpriteComponent> _spriteQuery;
    private readonly EntityQuery<TransformComponent> _xformQuery;
    private readonly EntityQuery<DreamMobSightComponent> _mobSightQuery;

    private readonly List<RendererMetaData> _spriteContainer = new();

    private readonly Dictionary<BlendMode, ShaderInstance> _blendModeInstances;

    private IRenderTexture? _mouseMapRenderTarget;
    private IRenderTexture? _baseRenderTarget;
    public readonly RenderTargetPool _renderTargetPool;
    private readonly Stack<RendererMetaData> _rendererMetaDataRental = new();
    private readonly Stack<RendererMetaData> _rendererMetaDataToReturn = new();
    public readonly MapTextRenderer _mapTextRenderer;

    private static readonly Matrix3x2 FlipMatrix = Matrix3x2.Identity with {
        M22 = -1
    };

    //Used for supressing the "No Literals" warning on shader index lookups
    private static class OdShaderId {
        public const string
            BlockColor = "blockcolor",
            Color = "color",
            BlendOverlay = "blend_overlay",
            BlendAdd = "blend_add",
            BlendSubtract = "blend_subtract",
            BlendMultiply = "blend_multiply",
            BlendInsetOverlay = "blend_inset_overlay";
    }

    public DreamViewOverlay(RenderTargetPool renderTargetPool) {
        IoCManager.InjectDependencies(this);
        _renderTargetPool = renderTargetPool;
        _transformSystem = _entitySystemManager.GetEntitySystem<TransformSystem>();
        _mapSystem = _entitySystemManager.GetEntitySystem<MapSystem>();
        _lookupSystem = _entitySystemManager.GetEntitySystem<EntityLookupSystem>();
        _appearanceSystem = _entitySystemManager.GetEntitySystem<ClientAppearanceSystem>();
        _screenOverlaySystem = _entitySystemManager.GetEntitySystem<ClientScreenOverlaySystem>();
        _imagesSystem = _entitySystemManager.GetEntitySystem<ClientImagesSystem>();
        _spriteSystem = _entitySystemManager.GetEntitySystem<DMISpriteSystem>();

        _spriteQuery = _entityManager.GetEntityQuery<DMISpriteComponent>();
        _xformQuery = _entityManager.GetEntityQuery<TransformComponent>();
        _mobSightQuery = _entityManager.GetEntityQuery<DreamMobSightComponent>();

        _sawmill.Debug("Loading shaders...");
        BlockColorInstance = _protoManager.Index<ShaderPrototype>(OdShaderId.BlockColor).InstanceUnique();
        ColorInstance = _protoManager.Index<ShaderPrototype>(OdShaderId.Color).InstanceUnique();
        _blendModeInstances = new(6) {
            {BlendMode.Default, _protoManager.Index<ShaderPrototype>(OdShaderId.BlendOverlay).InstanceUnique()}, //BLEND_DEFAULT (Same as BLEND_OVERLAY when there's no parent)
            {BlendMode.Overlay, _protoManager.Index<ShaderPrototype>(OdShaderId.BlendOverlay).InstanceUnique()}, //BLEND_OVERLAY
            {BlendMode.Add, _protoManager.Index<ShaderPrototype>(OdShaderId.BlendAdd).InstanceUnique()}, //BLEND_ADD
            {BlendMode.Subtract, _protoManager.Index<ShaderPrototype>(OdShaderId.BlendSubtract).InstanceUnique()}, //BLEND_SUBTRACT
            {BlendMode.Multiply, _protoManager.Index<ShaderPrototype>(OdShaderId.BlendMultiply).InstanceUnique()}, //BLEND_MULTIPLY
            {BlendMode.InsertOverlay, _protoManager.Index<ShaderPrototype>(OdShaderId.BlendInsetOverlay).InstanceUnique()} //BLEND_INSET_OVERLAY //TODO
        };

        // Set the default parameters for each blend mode
        foreach (var shader in _blendModeInstances.Values) {
            shader.SetParameter("colorMatrix", ColorMatrix.Identity.GetMatrix4());
            shader.SetParameter("offsetVector", ColorMatrix.Identity.GetOffsetVector());
            shader.SetParameter("isPlaneMaster", false);
        }

        _mapTextRenderer = new(_resourceCache, _tagManager);
    }

    protected override void Draw(in OverlayDrawArgs args) {
        using var _ = _prof.Group("Dream View Overlay");

        EntityUid? eye = _playerManager.LocalSession?.AttachedEntity;
        if (eye == null)
            return;

        //Main drawing of sprites happens here
        try {
            var viewportSize = (Vector2i)(args.Viewport.Size / args.Viewport.RenderScale);

            DrawAll(args, eye.Value, viewportSize);
        } catch (Exception e) {
            _sawmill.Error($"Error occurred while rendering frame. Error details:\n{e.Message}\n{e.StackTrace}");
        }

        _appearanceSystem.CleanUpUnusedFilters();
        _appearanceSystem.ResetFilterUsageFlags();

        RenderSourceLookup.Clear();

        _renderTargetPool.HandleEndOfFrame();

    }

    private void DrawAll(OverlayDrawArgs args, EntityUid eye, Vector2i viewportSize) {
        if (!_xformQuery.TryGetComponent(eye, out var eyeTransform))
            return;

        var eyeCoords = _transformSystem.GetMapCoordinates(eye, eyeTransform);
        if (!_mapManager.TryFindGridAt(eyeCoords, out var gridUid, out var grid))
            return;

        _mobSightQuery.TryGetComponent(eye, out var mobSight);
        var seeVis = mobSight?.SeeInvisibility ?? 127;
        var sight = mobSight?.Sight ?? 0;

        var worldHandle = args.WorldHandle;
        var worldAABB = args.WorldAABB;

        using (_prof.Group("lookup")) {
            //TODO use a sprite tree.
            //the scaling is to attempt to prevent pop-in, by getting sprites that are *just* offscreen
            _lookupSystem.GetEntitiesIntersecting(args.MapId, worldAABB.Scale(1.2f), EntitiesInView, MapLookupFlags);
        }

        var eyeTile = _mapSystem.GetTileRef(gridUid, grid, eyeCoords);
        var tiles = CalculateTileVisibility(gridUid, grid, eyeTile, seeVis);

        RefreshRenderTargets(args.WorldHandle, viewportSize);

        CollectVisibleSprites(tiles, EntitiesInView, gridUid, grid, eyeTile, seeVis, sight, worldAABB, worldHandle, viewportSize);

        //Final draw
        DrawPlanes(worldHandle, worldAABB);

        //At this point all the sprites have been rendered to the base target, now we just draw it to the viewport!
        worldHandle.DrawTexture(
            MouseMapRenderEnabled ? _mouseMapRenderTarget!.Texture : _baseRenderTarget!.Texture,
            args.WorldAABB.BottomLeft);
    }

    public ShaderInstance GetBlendAndColorShader(FastRenderData iconMetaData, bool ignoreColor = false, bool useOverlayMode = false) {
        BlendMode blendMode = useOverlayMode ? BlendMode.Overlay : iconMetaData.BlendMode;

        ColorMatrix colorMatrix;
        if (ignoreColor)
            colorMatrix = ColorMatrix.Identity;
        else
            colorMatrix = iconMetaData.ColorMatrixToApply;

        var blendAndColor = _blendModeInstances[blendMode];
        if (!iconMetaData.IsPlaneMaster && colorMatrix.Equals(ColorMatrix.Identity)) // We can get away with no duplication
            return blendAndColor;

        // RT's batching is a little broken and so we must duplicate the shader if we modify its parameters
        blendAndColor = blendAndColor.Duplicate();
        blendAndColor.SetParameter("colorMatrix", colorMatrix.GetMatrix4());
        blendAndColor.SetParameter("offsetVector", colorMatrix.GetOffsetVector());
        blendAndColor.SetParameter("isPlaneMaster", iconMetaData.IsPlaneMaster);
        return blendAndColor;
    }

    public void DrawIcon(DrawingHandleWorld handle, Vector2i renderTargetSize, FastRenderData iconMetaData, Vector2 positionOffset) {
        var frame = iconMetaData.Texture;
        var pixelPosition = (iconMetaData.Position + positionOffset) * IconSize;

        //if frame is null, this doesn't require a draw, so return NOP
        if (frame == null)
            return;

        pixelPosition += iconMetaData.TextureRenderOffset;

        handle.UseShader(GetBlendAndColorShader(iconMetaData, ignoreColor: true));

        handle.SetTransform(CalculateDrawingMatrix(iconMetaData.TransformToApply, pixelPosition, frame.Size, renderTargetSize));

        Color colorToApply = iconMetaData.ColorToApply;
        colorToApply.A *= iconMetaData.AlphaToApply;

        handle.DrawTextureRect(frame, Box2.FromDimensions(Vector2.Zero, frame.Size), colorToApply);

        if (iconMetaData.Particles is not null) {
            handle.UseShader(GetBlendAndColorShader(iconMetaData, ignoreColor: true));
            iconMetaData.Particles.Draw(handle, CalculateDrawingMatrix(iconMetaData.TransformToApply, pixelPosition, iconMetaData.Particles.RenderSize, renderTargetSize));
        }
    }

    /// <summary>
    /// Recreate all our render targets if our viewport size has changed.
    /// Also clears the mouse map and base render target.
    /// </summary>
    private void RefreshRenderTargets(DrawingHandleWorld handle, Vector2i size) {
        if (_baseRenderTarget == null || _baseRenderTarget.Size != size) {
            _baseRenderTarget?.Dispose();
            _mouseMapRenderTarget?.Dispose();
            _baseRenderTarget = _clyde.CreateRenderTarget(size, new(RenderTargetColorFormat.Rgba8Srgb), name: "Base Render Target");
            _mouseMapRenderTarget = _clyde.CreateRenderTarget(size, new(RenderTargetColorFormat.Rgba8Srgb), name: "MouseMap");
        } else {
            // Clear the mouse map lookup dictionary
            MouseMapLookup.Clear();
        }
    }

    public RendererMetaData RentRendererMetaData() {
        RendererMetaData result;
        if (_rendererMetaDataRental.Count == 0)
            result = new RendererMetaData();
        else {
            result = _rendererMetaDataRental.Pop();
            result.Reset();
        }

        _rendererMetaDataToReturn.Push(result);
        return result;
    }

    public void ReturnRendererMetaData() {
        //RendererMetaData objects get reused instead of garbage collected
        while (_rendererMetaDataToReturn.Count > 0)
            _rendererMetaDataRental.Push(_rendererMetaDataToReturn.Pop());
    }
    private void DrawPlanes(DrawingHandleWorld handle, Box2 worldAABB) {
        using (var _ = _prof.Group("draw planes map")) {
            handle.RenderInRenderTarget(_baseRenderTarget!, () => {
                foreach (int planeIndex in Planes.Keys.Order()) {
                    var plane = Planes[planeIndex];

                    plane.Draw(this, handle, worldAABB);

                    if (plane.Master is not null) {
                        // Don't draw this to the base render target if it has a RenderTarget starting with '*'
                        if (plane.Master.RenderTarget?.StartsWith('*') is true)
                            continue;

                        plane.Master.TextureOverride = plane.RenderTarget.Texture;
                        DrawIcon(handle, _baseRenderTarget!.Size, plane.Master.asFastRenderData(this, handle, Vector2.Zero), Vector2.Zero);
                    } else {
                        handle.UseShader(null);
                        handle.SetTransform(CreateRenderTargetFlipMatrix(_baseRenderTarget!.Size, Vector2.Zero));
                        handle.DrawTextureRect(plane.RenderTarget.Texture, Box2.FromTwoPoints(Vector2.Zero, _baseRenderTarget.Size));
                    }
                }
            }, new Color());
        }

        // TODO: Can this only be done once the user clicks?
        using (_prof.Group("draw planes mouse map")) {
            handle.RenderInRenderTarget(_mouseMapRenderTarget!, () => {
                foreach (int planeIndex in Planes.Keys.Order())
                    Planes[planeIndex].DrawMouseMap(handle, this, _mouseMapRenderTarget!.Size, worldAABB);
            }, new Color());
        }
    }





    /// <summary>
    /// Collect all of an icon's keep-together group and render them into one texture.
    /// </summary>
    public Texture ProcessKeepTogether(DrawingHandleWorld handle, RendererMetaData iconMetaData, Vector2i size) {
        //store the parent's transform, color, blend, and alpha - then clear them for drawing to the render target
        Matrix3x2 ktParentTransform = iconMetaData.TransformToApply;
        Color ktParentColor = iconMetaData.ColorToApply;
        float ktParentAlpha = iconMetaData.AlphaToApply;
        BlendMode ktParentBlendMode = iconMetaData.BlendMode;

        iconMetaData.TransformToApply = Matrix3x2.Identity;
        iconMetaData.ColorToApply = Color.White;
        iconMetaData.AlphaToApply = 1f;
        iconMetaData.BlendMode = BlendMode.Default;

        List<RendererMetaData> ktItems = new List<RendererMetaData>(iconMetaData.KeepTogetherGroup!.Count + 1) {
            iconMetaData
        };
        ktItems.AddRange(iconMetaData.KeepTogetherGroup);
        iconMetaData.KeepTogetherGroup.Clear();

        ktItems.Sort();
        //draw it onto an additional render target that we can return immediately for correction of transform
        IRenderTexture tempTexture = _renderTargetPool.Rent(size);

        handle.RenderInRenderTarget(tempTexture, () => {
            foreach (RendererMetaData ktItem in ktItems) {
                //draw the icon in the centre of the KT render target, based on the main icon position
                DrawIcon(handle, tempTexture.Size, ktItem.asFastRenderData(this, handle, Vector2.Zero), -iconMetaData.Position+((tempTexture.Size/IconSize) - Vector2.One) * new Vector2(0.5f));
            }
        }, Color.Transparent);

        //but keep the handle to the final KT group's render target so we don't override it later in the render cycle
        IRenderTexture ktTexture = _renderTargetPool.Rent(tempTexture.Size);
        handle.RenderInRenderTarget(ktTexture, () => {
            handle.UseShader(null);
            handle.SetTransform(CreateRenderTargetFlipMatrix(tempTexture.Size, Vector2.Zero));
            handle.DrawTextureRect(tempTexture.Texture, new Box2(Vector2.Zero, tempTexture.Size));
        }, Color.Transparent);

        _renderTargetPool.ReturnAtEndOfFrame(tempTexture);

        //now restore the original color, alpha, blend, and transform so they can be applied to the render target as a whole
        iconMetaData.TransformToApply = ktParentTransform;
        iconMetaData.ColorToApply = ktParentColor;
        iconMetaData.AlphaToApply = ktParentAlpha;
        iconMetaData.BlendMode = ktParentBlendMode;

        _renderTargetPool.ReturnAtEndOfFrame(ktTexture);
        return ktTexture.Texture;
    }

    /// <summary>
    /// Creates a transformation matrix that counteracts RT's
    /// <see cref="DrawingHandleBase.RenderInRenderTarget(IRenderTarget,Action,System.Nullable{Robust.Shared.Maths.Color})"/> quirks
    /// <br/>
    /// If you are using render targets, you will almost certainly want to use this
    /// </summary>
    /// <param name="renderTargetSize">Size of the render target</param>
    /// <param name="renderPosition">The translation to draw the icon at</param>
    /// <remarks>Due to RT applying transformations out of order, render the icon at Vector2.Zero</remarks>
    public static Matrix3x2 CreateRenderTargetFlipMatrix(Vector2i renderTargetSize, Vector2 renderPosition) {
        // RT flips the texture when doing a RenderInRenderTarget(), so we use _flipMatrix to reverse it
        // We must also handle translations here, since RT applies its own transform in an unexpected order
        return FlipMatrix * Matrix3x2.CreateTranslation(renderPosition.X, renderTargetSize.Y - renderPosition.Y);
    }

    public static Matrix3x2 CalculateDrawingMatrix(Matrix3x2 transform, Vector2 pixelPosition, Vector2i frameSize, Vector2i renderTargetSize) {
        //extract scale component of transform
        Vector2 scaleFactors = new Vector2(
            MathF.Sqrt(MathF.Pow(transform.M11,2) + MathF.Pow(transform.M12,2)),
            MathF.Sqrt(MathF.Pow(transform.M21,2) + MathF.Pow(transform.M22,2))
        );
        transform.M11 /= scaleFactors.X;
        transform.M12 /= scaleFactors.X;
        transform.M21 /= scaleFactors.Y;
        transform.M22 /= scaleFactors.Y;

        return
            Matrix3x2.CreateTranslation(-frameSize/2)  //translate to origin
            * transform                                       //rotate and translate
            * Matrix3x2.CreateTranslation(frameSize/2)       //translate back to original position
            * Matrix3x2.CreateScale(scaleFactors)               //scale
            * CreateRenderTargetFlipMatrix(renderTargetSize, pixelPosition-((scaleFactors-Vector2.One)*frameSize/2)); //flip and apply scale-corrected translation
    }
}

#region Render Toggle Commands
public sealed class ToggleScreenOverlayCommand : IConsoleCommand {
    // ReSharper disable once StringLiteralTypo
    public string Command => "togglescreenoverlay";
    public string Description => "Toggle rendering of screen objects";
    public string Help => "";

    public void Execute(IConsoleShell shell, string argStr, string[] args) {
        if (args.Length != 0) {
            shell.WriteError("This command does not take any arguments!");
            return;
        }

        IOverlayManager overlayManager = IoCManager.Resolve<IOverlayManager>();
        if (overlayManager.TryGetOverlay(typeof(DreamViewOverlay), out var overlay) &&
            overlay is DreamViewOverlay screenOverlay) {
            screenOverlay.ScreenOverlayEnabled = !screenOverlay.ScreenOverlayEnabled;
        }
    }
}

public sealed class ToggleMouseOverlayCommand : IConsoleCommand {
    // ReSharper disable once StringLiteralTypo
    public string Command => "togglemouseoverlay";
    public string Description => "Toggle rendering of mouse click area for screen objects";
    public string Help => "";

    public void Execute(IConsoleShell shell, string argStr, string[] args) {
        if (args.Length != 0) {
            shell.WriteError("This command does not take any arguments!");
            return;
        }

        IOverlayManager overlayManager = IoCManager.Resolve<IOverlayManager>();
        if (overlayManager.TryGetOverlay(typeof(DreamViewOverlay), out var overlay) &&
            overlay is DreamViewOverlay screenOverlay) {
            screenOverlay.MouseMapRenderEnabled = !screenOverlay.MouseMapRenderEnabled;
        }
    }
}
#endregion
