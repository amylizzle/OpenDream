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

internal sealed partial class DreamViewOverlay {


    // RendererMetaData is the tree node
    // on each render get your list of turfs/entities, use that to do hashtable lookup
    // one hashtable for tiletypeid, one for entities
    // the hashtable points to a sortedset of renderermetadatas per plane { plane1: [sprite, sprite, sprite]}
    // bash the sets together and do a sort - merging pre-sorted sets should be super fast
    // render plane

    // when a new appearance comes in or one is removed, find its tree(s) and rebuild them
    // find relevant entities (appearance to entity lookup needed? appearances can belong to multiple entities)
    // rebuild their trees
    // keeptogether groups can be pre-rendered and stored, marking the already used appearances as such
    public readonly Dictionary<int, DreamPlane> Planes = new();

    private DreamPlane GetPlane(int planeIndex, Vector2i? viewportSize) {
        if (Planes.TryGetValue(planeIndex, out var plane)) {
            if (viewportSize is not null && plane.RenderTarget.Size != viewportSize)
                plane.SetMainRenderTarget(_clyde.CreateRenderTarget(viewportSize.Value, new(RenderTargetColorFormat.Rgba8Srgb), name: $"Plane {planeIndex}"));
            return plane;
        }

        var renderTarget = _clyde.CreateRenderTarget(viewportSize ?? Vector2i.One, new(RenderTargetColorFormat.Rgba8Srgb), name: $"Plane {planeIndex}");

        plane = new(renderTarget);
        Planes.Add(planeIndex, plane);
        _sawmill.Verbose($"Created plane {planeIndex}");
        return plane;
    }

    private void ClearPlanes() {
        foreach (var (key, plane) in Planes) {
            // We can remove the plane if there's nothing on it now an appearance has been removed
            if (plane.Sprites.Count == 0 && plane.Master == null) {
                plane.Dispose();
                Planes.Remove(key);
                continue;
            }

            plane.Clear();
        }
    }
    private void CollectVisibleSprites(ViewAlgorithm.Tile?[,] tiles, HashSet<EntityUid> EntitiesInView, EntityUid gridUid, MapGridComponent grid, TileRef eyeTile, sbyte seeVis, SightFlags sight, Box2 worldAABB, DrawingHandleWorld handle, Vector2i viewportSize) {
        ClearPlanes(); //TODO caching
        var _spriteQuery = _entityManager.GetEntityQuery<DMISpriteComponent>();
        var _xformQuery = _entityManager.GetEntityQuery<TransformComponent>();
        var _screenOverlaySystem = _entitySystemManager.GetEntitySystem<ClientScreenOverlaySystem>();
        // Visible turf sprites
        foreach (var tile in tiles) {
            if (tile == null)
                continue;
            if (!tile.IsVisible && (sight & SightFlags.SeeTurfs) == 0)
                continue;

            Vector2i tilePos = eyeTile.GridIndices + (tile.DeltaX, tile.DeltaY);
            TileRef tileRef = _mapSystem.GetTileRef(gridUid, grid, tilePos);
            MapCoordinates worldPos = _mapSystem.GridTileToWorld(gridUid, grid, tilePos);
            var flick = _appearanceSystem.GetTurfFlick(tilePos.X, tilePos.Y, (int)worldPos.MapId);

            //pass the turf coords for client.images lookup
            Vector3 turfCoords = new Vector3(tileRef.X, tileRef.Y, (int)worldPos.MapId);
            DMISpriteComponent turfSprite = _appearanceSystem.GetTurfSprite((uint)tileRef.Tile.TypeId);
            if (turfSprite.SpritesByPlane is not null)
                foreach ((int planeIndex, SortedSet<RendererMetaData> metaDatas) in turfSprite.SpritesByPlane) {
                    SortedSet<FastRenderData> fastRenderDatas = new();
                    foreach (var meta in metaDatas) {
                        if (meta.IsPlaneMaster) //you don't render a plane master, nor does it's position matter
                            GetPlane(planeIndex, viewportSize).Master = meta;
                        else
                            fastRenderDatas.Add(meta.asFastRenderData(this, handle, worldPos.Position - Vector2.One));
                    }
                    GetPlane(planeIndex, viewportSize).Sprites.UnionWith(fastRenderDatas);
                }
        }

        // Visible entities
        using (var _ = _prof.Group("process entities")) {
            foreach (EntityUid entity in EntitiesInView) {
                if (!_spriteQuery.TryGetComponent(entity, out var sprite))
                    continue;

                var transform = _xformQuery.GetComponent(entity);
                if (!_spriteSystem.IsVisible(sprite, transform, seeVis, worldAABB))
                    continue;

                var worldPos = _transformSystem.GetWorldPosition(transform);

                // Check for visibility if the eye doesn't have SEE_OBJS or SEE_MOBS
                // TODO: Differentiate between objs and mobs
                if ((sight & (SightFlags.SeeObjs | SightFlags.SeeMobs)) == 0) {
                    var tilePos = _mapSystem.WorldToTile(gridUid, grid, worldPos) - eyeTile.GridIndices + _interfaceManager.View.Center + 1;
                    if (tilePos.X < 0 || tilePos.Y < 0 || tilePos.X >= tiles.GetLength(0) || tilePos.Y >= tiles.GetLength(1))
                        continue;

                    var tile = tiles[tilePos.X, tilePos.Y];
                    if (tile?.IsVisible is not true)
                        continue;
                }

                var flick = _appearanceSystem.GetMovableFlick(entity);
                if (sprite.SpritesByPlane is not null)
                    foreach ((int planeIndex, SortedSet<RendererMetaData> metaDatas) in sprite.SpritesByPlane) {
                        SortedSet<FastRenderData> fastRenderDatas = new();
                        foreach (var meta in metaDatas) {
                            if (meta.IsPlaneMaster) //you don't render a plane master, nor does it's position matter
                                GetPlane(planeIndex, viewportSize).Master = meta;
                            else
                                fastRenderDatas.Add(meta.asFastRenderData(this, handle, worldPos - new Vector2(0.5f)));
                        }
                        GetPlane(planeIndex, viewportSize).Sprites.UnionWith(fastRenderDatas);
                    }
            }
        }

        // Screen objects
        if (ScreenOverlayEnabled) {
            using var _ = _prof.Group("screen objects");

            foreach (EntityUid uid in _screenOverlaySystem.ScreenObjects) {
                if (!_entityManager.TryGetComponent(uid, out DMISpriteComponent? sprite) || sprite.ScreenLocation == null)
                    continue;
                if (!_spriteSystem.IsVisible(sprite, null, seeVis, null))
                    continue;
                if (sprite.ScreenLocation.MapControl != null) // Don't render screen objects meant for other map controls
                    continue;

                Vector2i dmiIconSize = sprite.Icon.DMI?.IconSize ?? new(IconSize, IconSize);
                Vector2 position = sprite.ScreenLocation.GetViewPosition(worldAABB.BottomLeft, _interfaceManager.View, IconSize, dmiIconSize);
                Vector2 iconSize = sprite.Icon.DMI == null ? Vector2.Zero : sprite.Icon.DMI.IconSize / (float)IconSize;
                if (sprite.SpritesByPlane is not null)
                    foreach ((int planeIndex, SortedSet<RendererMetaData> metaDatas) in sprite.SpritesByPlane) {
                        foreach (var meta in metaDatas) {
                            if (meta.IsPlaneMaster) //you don't render a plane master, nor does it's position matter
                                GetPlane(planeIndex, viewportSize).Master = meta;
                            else {
                                SortedSet<FastRenderData> fastRenderDatas = new();
                                for (int x = 0; x < sprite.ScreenLocation.RepeatX; x++) {
                                    for (int y = 0; y < sprite.ScreenLocation.RepeatY; y++) {

                                        fastRenderDatas.Add(meta.asFastRenderData(this, handle, position + iconSize * new Vector2(x, y)));
                                    }
                                    GetPlane(planeIndex, viewportSize).Sprites.UnionWith(fastRenderDatas);
                                }
                            }
                        }
                    }
            }
        }
    }

    // private void ProcessSprites(DrawingHandleWorld handle, Vector2i viewportSize, Box2 worldAABB) {
    //     using var _ = _prof.Group("process sprites / draw render targets");

    //     //all sprites with render targets get handled first - these are ordered by sprites.Sort(), so we can just iterate normally
    //     foreach (var sprite in _spriteContainer) {
    //         var plane = GetPlane(sprite.Plane, viewportSize);

    //         if (!string.IsNullOrEmpty(sprite.RenderTarget)) {
    //             //if this sprite has a render target, draw it to a slate instead. If it needs to be drawn on the map, a second sprite instance will already have been created for that purpose
    //             if (!RenderSourceLookup.TryGetValue(sprite.RenderTarget, out var tmpRenderTarget)) {
    //                 var size = sprite.IsPlaneMaster ? viewportSize : sprite.MainIcon?.DMI?.IconSize ?? viewportSize;
    //                 tmpRenderTarget = _renderTargetPool.Rent(size);
    //                 RenderSourceLookup.Add(sprite.RenderTarget, tmpRenderTarget);
    //                 _renderTargetPool.ReturnAtEndOfFrame(tmpRenderTarget);
    //             }

    //             if (sprite.IsPlaneMaster) { //if this is also a plane master
    //                 sprite.Position = Vector2.Zero; //plane masters should not have a position offset
    //                 plane.Master = sprite;
    //                 plane.SetTemporaryRenderTarget(tmpRenderTarget);
    //             } else { //if not a plane master, draw the sprite to the render target
    //                 //note we don't draw this to the mouse-map because that's handled when the RenderTarget is used as a source later
    //                 DrawOnRenderTarget(handle, tmpRenderTarget, sprite);
    //             }
    //         } else { //We are no longer dealing with RenderTargets, just regular old planes, so we collect the draw actions for batching
    //             //if this is a plane master then we don't render it, we just set it as the plane's master
    //             if (sprite.IsPlaneMaster) {
    //                 sprite.Position = Vector2.Zero; //plane masters should not have a position offset
    //                 plane.Master = sprite;

    //                 continue;
    //             }

    //             //add this sprite for rendering
    //             plane.Sprites.Add(sprite);
    //         }
    //     }
    // }

    /// <summary>
    /// Used by <see cref="ProcessSprites"/> to render an icon onto its render_target.
    /// In a separate method to prevent unused closure allocations.
    /// </summary>
    // private void DrawOnRenderTarget(DrawingHandleWorld handle, IRenderTarget renderTarget, RendererMetaData sprite) {
    //     handle.RenderInRenderTarget(renderTarget, () => {
    //         //draw the sprite centered on the RenderTarget
    //         DrawIcon(handle, renderTarget.Size, sprite, -sprite.Position);
    //     }, new Color());
    // }


}
