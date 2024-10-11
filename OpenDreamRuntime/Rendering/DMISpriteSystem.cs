﻿using OpenDreamShared.Dream;
using OpenDreamShared.Rendering;
using Robust.Shared.GameStates;

namespace OpenDreamRuntime.Rendering;

public sealed class DMISpriteSystem : EntitySystem {
    private ServerAppearanceSystem? _appearance;
    [Dependency] private readonly IEntitySystemManager _entitySystemManager = default!;

    public override void Initialize() {
        SubscribeLocalEvent<DMISpriteComponent, ComponentGetState>(GetComponentState);
        _entitySystemManager.TryGetEntitySystem(out _appearance);
    }

    private void GetComponentState(EntityUid uid, DMISpriteComponent component, ref ComponentGetState args) {
        args.State = new SharedDMISpriteComponent.DMISpriteComponentState(component.Appearance.GetHashCode(), component.ScreenLocation);
    }

    public void SetSpriteAppearance(Entity<DMISpriteComponent> ent, IconAppearance appearance, bool dirty = true) {
        DMISpriteComponent component = ent.Comp;
        component.Appearance = _appearance?.AddAppearance(appearance);
        if(dirty)
            Dirty(ent, component);
    }

    public void SetSpriteScreenLocation(Entity<DMISpriteComponent> ent, ScreenLocation screenLocation) {
        DMISpriteComponent component = ent.Comp;
        component.ScreenLocation = screenLocation;
        Dirty(ent, component);
    }
}
