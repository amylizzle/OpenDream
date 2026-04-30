using System.Collections;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;

//entity manager manages all entities, keeping track of them and their attached components
//entity hold a position and a uid
//manager holds uid -> component list mapping
//*everything* clientside is an entity OR an appearance (appearances can be attached to entities)

//NetworkSystem will be renamed to just NetworkSystem or something, and that will handle the adding of extensions to manage
//network propagation

//should this extend NetworkSystem?
//other NetworkSystems: ClientImages, Appearance, verbs

public sealed class EntityManager : NetworkSystem {
    private Dictionary<EntityUid, Entity> _entityTable = new();

    public Entity SpawnEntity() {

    }

    public void DeleteEntity() {

    }

    public List<Entity> GetEntities() {

    }

    public bool TryGetComponent<T>(Entity entity, [NotNullWhen(true)] out T? component) {

    }

    public Component GetComponent() {

    }

    public Component AddComponent<Component>(Entity entity) {

    }

    public void RemoveComponent(){}

    public void Dirty(Component component){}




}
