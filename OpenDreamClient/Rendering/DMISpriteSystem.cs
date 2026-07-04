using OpenDreamClient.Interface;
using OpenDreamClient.Rendering.Particles;
using OpenDreamShared.Dream;
using OpenDreamShared.Rendering;
using Robust.Client.GameObjects;
using Robust.Client.Graphics;
using Robust.Client.Player;
using Robust.Shared.GameStates;
using Robust.Shared.Timing;

namespace OpenDreamClient.Rendering;

internal sealed partial class DMISpriteSystem : EntitySystem {
    [Dependency] private IDreamInterfaceManager _interfaceManager = default!;
    [Dependency] private IEntityManager _entityManager = default!;
    [Dependency] private IGameTiming _gameTiming = default!;
    [Dependency] private ClientAppearanceSystem _appearanceSystem = default!;
    [Dependency] private IOverlayManager _overlayManager = default!;
    [Dependency] private IClyde _clyde = default!;
    [Dependency] private IPlayerManager _playerManager = default!;
    [Dependency] private EntityLookupSystem _lookupSystem = default!;
    [Dependency] private TransformSystem _transformSystem = default!;
    [Dependency] private ParticlesManager _particlesManager = default!;
    [Dependency] private ClientImagesSystem _clientImagesSystem = default!;

    public RenderTargetPool RenderTargetPool = default!;
    public int IconSize => _interfaceManager.IconSize;
    private EntityQuery<DMISpriteComponent> _spriteQuery;
    private DreamViewOverlay _mapOverlay = default!;
    public override void Initialize() {
        SubscribeLocalEvent<DMISpriteComponent, ComponentAdd>(HandleComponentAdd);
        SubscribeLocalEvent<DMISpriteComponent, ComponentHandleState>(HandleComponentState);
        SubscribeLocalEvent<DMISpriteComponent, ComponentRemove>(HandleComponentRemove);
        SubscribeLocalEvent<TransformComponent, MoveEvent>(HandleTransformMove);
        SubscribeLocalEvent<TileChangedEvent>(HandleTileChanged);

        RenderTargetPool = new(_clyde);
        _spriteQuery = _entityManager.GetEntityQuery<DMISpriteComponent>();
        _mapOverlay = new DreamViewOverlay(RenderTargetPool);
        _overlayManager.AddOverlay(_mapOverlay);
    }

    public override void Shutdown() {
        RenderTargetPool = default!;
        _overlayManager.RemoveOverlay<DreamViewOverlay>();
        _mapOverlay = default!;
    }

    /// <summary>
    /// Checks if a sprite should be visible to the player<br/>
    /// Checks the appearance's invisibility, if it's inside the given AABB, and whether it's parented to another entity
    /// </summary>
    /// <param name="sprite">The sprite to check</param>
    /// <param name="transform">The entity's transform, the parent check is skipped if this is null</param>
    /// <param name="seeInvisibility">The eye's see_invisibility var</param>
    /// <param name="worldAABB">The box visible to the viewport</param>
    public bool IsVisible(DMISpriteComponent sprite, TransformComponent? transform, int? seeInvisibility, Box2? worldAABB) {
        var icon = sprite.Icon;
        if (icon.Appearance?.Invisibility > seeInvisibility)
            return false;

        if (transform != null) {
            if (worldAABB != null) {
                Box2? aabb = null;
                icon.GetWorldAABB(_transformSystem.GetWorldPosition(transform), ref aabb);
                if (aabb.HasValue && !worldAABB.Value.Intersects(aabb.Value))
                    return false;
            }

            //Only render movables not inside another movable's contents (parented to the grid)
            //TODO: Use RobustToolbox's container system/components?
            if (transform.ParentUid != transform.GridUid)
                return false;
        }

        return true;
    }

    private void OnIconSizeChanged(EntityUid uid) {
        if (!_entityManager.TryGetComponent<TransformComponent>(uid, out var transform))
            return;

        _lookupSystem.FindAndAddToEntityTree(uid, xform: transform);
    }

    private void HandleComponentAdd(EntityUid uid, DMISpriteComponent component, ref ComponentAdd args) {
        component.Icon = new DreamIcon(RenderTargetPool, _interfaceManager, _gameTiming, _clyde, _appearanceSystem);
        component.Icon.SizeChanged += () => OnIconSizeChanged(uid);
    }

    private void HandleComponentState(EntityUid uid, DMISpriteComponent component, ref ComponentHandleState args) {
        SharedDMISpriteComponent.DMISpriteComponentState? state = (SharedDMISpriteComponent.DMISpriteComponentState?)args.Current;
        if (state == null)
            return;
        int tbreaker = 0;
        _mapOverlay.DirtyTileVisibility(); // Our icon's opacity may have changed
        component.ScreenLocation = state.ScreenLocation;
        component.Icon.SetAppearance(state.AppearanceId);
        _appearanceSystem.LoadAppearance(state.AppearanceId!.Value, (app) => {
            component.SpriteTree = BuildSpriteTree(
                app,
                Vector2.Zero, uid,
                component.ScreenLocation is not null,
                ref tbreaker,
                sbyte.MaxValue);
            TraverseSpriteTree(component);
        });
    }

    private void HandleTransformMove(EntityUid uid, TransformComponent component, ref MoveEvent args) {
        if (!_spriteQuery.TryGetComponent(uid, out var sprite))
            return;

        if (sprite.Icon.Appearance?.Opacity is true || uid == _playerManager.LocalSession?.AttachedEntity)
            _mapOverlay.DirtyTileVisibility(); // A movable with opacity=TRUE, or our eye, has moved
    }

    private void HandleTileChanged(ref TileChangedEvent ev) {
        _mapOverlay.DirtyTileVisibility();
    }

    private static void HandleComponentRemove(EntityUid uid, DMISpriteComponent component, ref ComponentRemove args) {
        component.Icon.Dispose();
    }

    public void TraverseSpriteTree(DMISpriteComponent component) {
        if (component.SpriteTree is not null)
            component.SpriteTree.MainIcon = component.Icon;
        else
            return;
        component.SpritesByPlane = new();
        _traverseSpriteTree(component.SpriteTree, ref component.SpritesByPlane);

    }

    private void _traverseSpriteTree(RendererMetaData current, ref Dictionary<int, SortedSet<RendererMetaData>> spritesByPlane) {
        if (current.Overlays is not null)
            foreach(var overlay in current.Overlays)
                _traverseSpriteTree(overlay, ref spritesByPlane);
        if (current.Underlays is not null)
            foreach(var underlay in current.Underlays)
                _traverseSpriteTree(underlay, ref spritesByPlane);
        if (current.VisContents is not null)
            foreach(var vis in current.VisContents)
                _traverseSpriteTree(vis, ref spritesByPlane);
        // If the render-target starts with *, we don't render it to the plane's base render target.
        // If it doesn't we create a placeholder RenderMetaData to position it correctly.
        // Ignore plane masters here, they're handled in DrawPlanes()
        if (!string.IsNullOrEmpty(current.RenderTarget) && current.RenderTarget[0] != '*' && !current.IsPlaneMaster) {
            RendererMetaData renderTargetPlaceholder = _mapOverlay.RentRendererMetaData();

            //transform, color, alpha, filters - they should all already have been applied, so we leave them null in the placeholder
            renderTargetPlaceholder.MainIcon = current.MainIcon;
            renderTargetPlaceholder.BaseAppearance = current.BaseAppearance;
            renderTargetPlaceholder.Position = current.Position;
            renderTargetPlaceholder.Uid = current.Uid;
            renderTargetPlaceholder.ClickUid = current.Uid;
            renderTargetPlaceholder.IsScreen = current.IsScreen;
            renderTargetPlaceholder.TieBreaker = current.TieBreaker;
            renderTargetPlaceholder.Plane = current.Plane;
            renderTargetPlaceholder.Layer = current.Layer;
            renderTargetPlaceholder.RenderSource = current.RenderTarget;
            renderTargetPlaceholder.MouseOpacity = current.MouseOpacity;
            renderTargetPlaceholder.AppearanceFlags = current.AppearanceFlags;
            if (!spritesByPlane.ContainsKey(renderTargetPlaceholder.Plane)) spritesByPlane.Add(renderTargetPlaceholder.Plane, new());
            spritesByPlane[renderTargetPlaceholder.Plane].Add(renderTargetPlaceholder);
        } else {
            if (!spritesByPlane.ContainsKey(current.Plane)) spritesByPlane.Add(current.Plane, new());
            spritesByPlane[current.Plane].Add(current);
        }
    }

    //handles underlays, overlays, appearance flags, images. Adds them to the result list, so they can be sorted and drawn with DrawIcon()
    public RendererMetaData BuildSpriteTree(ImmutableAppearance appearance, Vector2 position, EntityUid uid, bool isScreen, ref int tieBreaker, sbyte seeVis, RendererMetaData? parentIcon = null, bool keepTogether = false, Vector3? turfCoords = null, ClientAppearanceSystem.Flick? flick = null) {
        RendererMetaData current = _mapOverlay.RentRendererMetaData();
        current.BaseAppearance = appearance;
        current.Position = position + (appearance.TotalPixelOffset / (float)IconSize);
        current.Uid = uid;
        current.ClickUid = uid;
        current.IsScreen = isScreen;
        current.TieBreaker = tieBreaker;
        current.RenderSource = appearance.RenderSource;
        current.RenderTarget = appearance.RenderTarget;
        current.AppearanceFlags = appearance.AppearanceFlags;
        current.BlendMode = appearance.BlendMode;
        current.Flick = flick;

        //reverse rotation transforms because of 180 flip from RenderTarget->world transform
        Matrix3x2 iconAppearanceTransformMatrix = new Matrix3x2(
            appearance.Transform[0], -appearance.Transform[2],
            -appearance.Transform[1], appearance.Transform[3],
            appearance.Transform[4], appearance.Transform[5]
        );

        if (parentIcon != null) {
            current.ClickUid = parentIcon.ClickUid;
            current.MouseOpacity = parentIcon.MouseOpacity;
            if ((appearance.AppearanceFlags & AppearanceFlags.ResetColor) != 0 || keepTogether) { //RESET_COLOR
                current.ColorToApply = appearance.Color;
                current.ColorMatrixToApply = appearance.ColorMatrix;
            } else {
                current.ColorToApply = parentIcon.ColorToApply * appearance.Color;
                ColorMatrix.Multiply(in parentIcon.ColorMatrixToApply, in appearance.ColorMatrix, out current.ColorMatrixToApply);
            }

            if ((appearance.AppearanceFlags & AppearanceFlags.ResetAlpha) != 0 || keepTogether) //RESET_ALPHA
                current.AlphaToApply = appearance.Alpha / 255.0f;
            else
                current.AlphaToApply = parentIcon.AlphaToApply * (appearance.Alpha / 255.0f);

            if ((appearance.AppearanceFlags & AppearanceFlags.ResetTransform) != 0 || keepTogether) //RESET_TRANSFORM
                current.TransformToApply = iconAppearanceTransformMatrix;
            else
                current.TransformToApply = iconAppearanceTransformMatrix * parentIcon.TransformToApply;

            if (appearance.Plane < -10000) //FLOAT_PLANE - Note: yes, this really is how it works. Yes it's dumb as shit.
                current.Plane = parentIcon.Plane + (appearance.Plane + 32767);
            else
                current.Plane = appearance.Plane;

            //FLOAT_LAYER - if this icon's layer is negative, it's a float layer so set it's layer equal to the parent object and sort through the float_layer shit later
            current.Layer = (appearance.Layer < 0) ? parentIcon.Layer : appearance.Layer;

            if (current.BlendMode == BlendMode.Default)
                current.BlendMode = parentIcon.BlendMode;
        } else {
            current.ColorToApply = appearance.Color;
            current.ColorMatrixToApply = appearance.ColorMatrix;
            current.AlphaToApply = appearance.Alpha / 255.0f;
            current.TransformToApply = iconAppearanceTransformMatrix;
            current.Plane = appearance.Plane;
            current.Layer = Math.Max(0, appearance.Layer); //float layers are invalid for icons with no parent
            current.MouseOpacity = appearance.MouseOpacity;
        }

        //special handling for EFFECTS_LAYER and BACKGROUND_LAYER
        //SO IT TURNS OUT EFFECTS_LAYER IS JUST A LIE *scream
        //and BACKGROUND_LAYER is basically the same behaviour as FLOAT_PLANE
        if (current.Layer >= 20000) {
            current.Layer -= 40000;
            current.IsScreen = false; //BACKGROUND_LAYER renders behind everything on that plane
        }

        keepTogether |= (current.AppearanceFlags & AppearanceFlags.KeepTogether) != 0; //KEEP_TOGETHER

        //underlays - colour, alpha, and transform are inherited, but filters aren't
        //underlays are sorted in reverse order to overlays
        for (int underlayIndex = appearance.Underlays.Length - 1; underlayIndex >= 0; underlayIndex--) {
            ImmutableAppearance underlay = appearance.Underlays[underlayIndex];
            current.Underlays ??= new();

            tieBreaker++;

            // KEEP_APART flag or on a different plane than the parent atom (implicitly treated as KEEP_APART)
            var keepApart = underlay.Plane != appearance.Plane ||
                            (underlay.AppearanceFlags & AppearanceFlags.KeepApart) != 0;

            if (!keepTogether || keepApart) { //KEEP_TOGETHER wasn't set on our parent, or KEEP_APART
                current.Underlays.Add(BuildSpriteTree(underlay, current.Position, uid, isScreen, ref tieBreaker, seeVis, current)!);
            } else {
                current.KeepTogetherGroup ??= new(); //TODO this logic needs updating to handle children of the KT appearance which have KEEP_APART
                current.KeepTogetherGroup.Add(BuildSpriteTree(underlay, current.Position, uid, isScreen, ref tieBreaker, seeVis, current, keepTogether)!);
            }
        }

        tieBreaker++;
        current.TieBreaker = tieBreaker;

        //overlays - colour, alpha, and transform are inherited, but filters aren't
        foreach (ImmutableAppearance overlay in appearance.Overlays) {
            current.Overlays ??= new();

            tieBreaker++;

            // KEEP_APART flag or on a different plane than the parent atom (implicitly treated as KEEP_APART)
            var keepApart = overlay.Plane != appearance.Plane ||
                            (overlay.AppearanceFlags & AppearanceFlags.KeepApart) != 0;

            if (!keepTogether || keepApart) { //KEEP_TOGETHER wasn't set on our parent, or KEEP_APART
                current.Overlays.Add(BuildSpriteTree(overlay, current.Position, uid, isScreen, ref tieBreaker, seeVis, current)!);
            } else {
                current.KeepTogetherGroup ??= new(); //TODO this logic needs updating to handle children of the KT appearance which have KEEP_APART
                current.KeepTogetherGroup.Add(BuildSpriteTree(overlay, current.Position, uid, isScreen, ref tieBreaker, seeVis, current, keepTogether)!);
            }
        }

        //client images act as either an overlay or replace the main icon
        //notably they cannot be applied to overlays, so don't check for them if this is an under/overlay
        //note also that we use turfCoords and not current.Position because we want world-coordinates, not screen coordinates. This is only used for turfs.
        if (parentIcon == null && _clientImagesSystem.TryGetClientImages(current.Uid, turfCoords, out List<NetEntity>? attachedClientImages)) {
            foreach (NetEntity ciNetEntity in attachedClientImages) {
                EntityUid imageEntity = _entityManager.GetEntity(ciNetEntity);
                if (!TryComp<DMISpriteComponent>(imageEntity, out var sprite))
                    continue;
                if (sprite.Icon.Appearance == null)
                    continue;
                if (sprite.Icon.Appearance.Override) {
                    current.MainIcon = sprite.Icon;
                    current.Position += sprite.Icon.Appearance.TotalPixelOffset / (float)IconSize;
                } else {
                    current.Overlays ??= new();
                    current.Overlays.Add(sprite.SpriteTree!);
                }
            }
        }

        foreach (var visContent in appearance.VisContents) {
            EntityUid visContentEntity = _entityManager.GetEntity(visContent);
            if (!TryComp<DMISpriteComponent>(visContentEntity, out var sprite))
                continue;
            if (sprite.Icon.Appearance is null)
                continue;
            if (!IsVisible(sprite, null, seeVis, null)) //TODO seevis
                continue;
            current.VisContents ??= new();
            current.VisContents.Add(BuildSpriteTree(sprite.Icon.Appearance, position, visContentEntity, false, ref tieBreaker, seeVis, current, keepTogether)!);

            // TODO: click uid should be set to current.uid again
            // TODO: vis_flags
        }

        //maptext is basically just an image of rendered text added as an overlay
        if (appearance.Maptext != null) { //if has maptext
            RendererMetaData maptext = _mapOverlay.RentRendererMetaData();
            maptext.MainIcon = null;
            maptext.BaseAppearance = current.BaseAppearance;
            maptext.Position = current.Position;
            maptext.Uid = current.Uid;
            maptext.ClickUid = current.Uid;
            maptext.IsScreen = current.IsScreen;
            tieBreaker++;
            maptext.TieBreaker = tieBreaker;
            maptext.Plane = current.Plane;
            maptext.Layer = current.Layer;
            maptext.RenderSource = null;
            maptext.RenderTarget = null;
            maptext.MouseOpacity = current.MouseOpacity;
            maptext.TransformToApply = current.TransformToApply;
            maptext.ColorToApply = current.ColorToApply;
            maptext.ColorMatrixToApply = current.ColorMatrixToApply;
            maptext.AlphaToApply = current.AlphaToApply;
            maptext.BlendMode = current.BlendMode;

            maptext.AppearanceFlags = current.AppearanceFlags;
            maptext.AppearanceFlags &= ~AppearanceFlags.PlaneMaster; //doesn't make sense for maptext

            maptext.Maptext = appearance.Maptext;
            maptext.MaptextSize = appearance.MaptextSize;
            maptext.Position += appearance.MaptextOffset / (float)IconSize;
            current.Overlays ??= new();
            current.Overlays.Add(maptext);
        }

        //query entity for particles component - check for parent to make sure this is the top level entity
        if (parentIcon is null && _particlesManager.TryGetParticleSystem(uid, out var particlesSystem)) {
            current.Particles = particlesSystem;
        }

        return current;
    }


}
