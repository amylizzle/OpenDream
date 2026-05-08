using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading;

//entity manager manages all entities, keeping track of them and their attached components
//entity hold a position and a uid
//manager holds uid -> component list mapping
//*everything* clientside is an entity OR an appearance (appearances can be attached to entities)

//NetworkSystem will handle the adding of extensions to manage network propagation


public sealed class EntityManager : NetworkSystem {
    private int _entityUidCounter = 0;
    private Dictionary<EntityUid, Entity> _entityTable = new();
    private Dictionary<EntityUid, Dictionary<Type, Component>> _entityComponentTable = new();

    public Entity SpawnEntity(MapCoordinates mapCoordinates) {
        var uid = new EntityUid(Interlocked.Increment(ref _entityUidCounter));
        var entity = new Entity(uid, mapCoordinates);
        _entityTable[uid] = entity;
        _entityComponentTable[uid] = new Dictionary<Type, Component>();
        return entity;
    }

    public void DeleteEntity(EntityUid uid) {
        _entityTable.Remove(uid);
        _entityComponentTable.Remove(uid);
    }

    public List<Entity> GetEntities() {
        return _entityTable.Values.ToList();
    }

    public bool TryGetComponent<T>(EntityUid entity, [NotNullWhen(true)] out T? component) where T: Component{
        if (_entityComponentTable.TryGetValue(entity, out var components)) {
            if (components.TryGetValue(typeof(T), out var comp)) {
                component = (T)comp;
                return true;
            }
        }
        component = default;
        return false;
    }

    public Component GetComponent<T>(EntityUid entityUid) where T : Component {
        if (_entityComponentTable.TryGetValue(entityUid, out var components) &&
            components.TryGetValue(typeof(T), out var component)) {
            return component;
        }
        throw new KeyNotFoundException($"Component of type {typeof(T).Name} not found on entity {entityUid}");
    }

    public T AddComponent<T>(EntityUid entity) where T: Component{
        var component = Activator.CreateInstance<T>();
        _entityComponentTable[entity][typeof(T)] = component;
        return (T)component;
    }

    public void RemoveComponent(EntityUid entityUid, Component component) {
        if (_entityComponentTable.TryGetValue(entityUid, out var components)) {
            components.Remove(component.GetType());
        }
    }
}
