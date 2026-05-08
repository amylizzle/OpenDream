using System.Collections.Generic;
using OpenDreamShared.EngineUtils;

public interface IMapManager {
    public abstract Entity<MapGridComponent> CreateGridEntity(uint z);
    public abstract void DeleteMap(uint z);
    public abstract void SetTiles(Entity<MapGridComponent> grid, List<(Vector2u, Tile)> tiles);
    public abstract void SetTile(Entity<MapGridComponent> grid, Vector2u pos, Tile tile);
    public abstract List<(Vector2u, Tile)> GetAllTiles(Entity<MapGridComponent> grid);
}

public sealed class MapManager : NetworkSystem, IMapManager {

    public void SetTiles(Entity<MapGridComponent> grid, List<(Vector2u, Tile)> tiles) {
        throw new System.NotImplementedException();
    }

    public void SetTile(Entity<MapGridComponent> grid, Vector2u pos, Tile tile) {
        throw new System.NotImplementedException();
    }

    public List<(Vector2u, Tile)> GetAllTiles(Entity<MapGridComponent> grid) {
        throw new System.NotImplementedException();
    }

    Entity<MapGridComponent> IMapManager.CreateGridEntity(uint z) {
        throw new System.NotImplementedException();
    }

    public void DeleteMap(uint z) {
        throw new System.NotImplementedException();
    }
}

public struct Tile {
    public int TypeId;

    public Tile(int id) {
        TypeId = id;
    }

    public static Tile Empty = new Tile();
}
