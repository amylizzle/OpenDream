using OpenDreamRuntime.Procs;
using OpenDreamRuntime.Rendering;
using OpenDreamShared.Dream;
using OpenDreamShared.EngineUtils;


namespace OpenDreamRuntime.Objects.Types;


public class DreamObjectMovable : DreamObjectAtom {
    public EntityUid Entity;
    public readonly DMISpriteComponent SpriteComponent;
    public DreamObjectAtom? Loc;
    public MapCoordinates Position => _transformComponent.Position;
    public uint X => Position.X;
    public uint Y => Position.Y;
    public uint Z => Position.Z;

    private readonly TransformComponent _transformComponent;
    private readonly MetaDataComponent _metaDataComponent;
    private readonly ContentsComponent _contentsComponent;
    private readonly MovableContentsList _contents;
    private string? _screenLoc;
    private DreamObjectParticles? _particles;

    private string? ScreenLoc {
        get => _screenLoc;
        set => SetScreenLoc(value);
    }

    public DreamObjectMovable(DreamObjectDefinition objectDefinition) : base(objectDefinition) {
        Entity = AtomManager.CreateMovableEntity(this);
        SpriteComponent = EntityManager.GetComponent<DMISpriteComponent>(Entity);
        AtomManager.SetSpriteAppearance((Entity, SpriteComponent), AtomManager.GetAppearanceFromDefinition(ObjectDefinition));

        _contentsComponent = EntityManager.GetComponent<ContentsComponent>(Entity);
        _contents = new MovableContentsList(ObjectTree.List.ObjectDefinition, this, _contentsComponent);

        _metaDataComponent = EntityManager.GetComponent<MetaDataComponent>(Entity);
    }

    public override void Initialize(DreamProcArguments args) {
        base.Initialize(args);

        ObjectDefinition.Variables["screen_loc"].TryGetValueAsString(out var screenLoc);
        ScreenLoc = screenLoc;

        _metaDataComponent.Name = GetDisplayName();
        _metaDataComponent.Description = GetRTEntityDesc();

        args.GetArgument(0).TryGetValueAsDreamObject<DreamObjectAtom>(out var loc);
        SetLoc(loc); //loc is set before /New() is ever called
    }

    protected override void HandleDeletion(bool possiblyThreaded) {
        // SAFETY: Deleting entities is not threadsafe.
        if (possiblyThreaded) {
            EnterIntoDelQueue();
            return;
        }

        WalkManager.StopWalks(this);
        _particles?.Delete();
        _particles = null;
        AtomManager.DeleteMovableEntity(this);

        base.HandleDeletion(possiblyThreaded);
    }

    protected override bool TryGetVar(string varName, out DreamValue value) {
        switch (varName) {
            case "x":
                value = new(X);
                return true;
            case "y":
                value = new(Y);
                return true;
            case "z":
                value = new(Z);
                return true;
            case "loc":
                value = new(Loc);
                return true;
            case "bound_width":
            case "bound_height":
                value = new(DreamManager.WorldInstance.IconSize); // TODO: Custom bounds support
                return true;
            case "screen_loc":
                value = (ScreenLoc != null) ? new(ScreenLoc) : DreamValue.Null;
                return true;
            case "contents":
                value = new(_contents);
                return true;
            case "locs":
                // Unimplemented; just return a list containing src.loc
                DreamList locs = ObjectTree.CreateList();
                locs.AddValue(new(Loc));

                value = new DreamValue(locs);
                return true;
            case "particles":
                value = new(_particles);
                return true;
            default:
                return base.TryGetVar(varName, out value);
        }
    }

    protected override void SetVar(string varName, DreamValue value) {
        switch (varName) {
            case "x":
            case "y":
            case "z": {
                int x = (varName == "x") ? value.MustGetValueAsInteger() : (int)X;
                int y = (varName == "y") ? value.MustGetValueAsInteger() : (int)Y;
                int z = (varName == "z") ? value.MustGetValueAsInteger() : (int)Z;

                DreamMapManager.TryGetTurfAt((x, y), z, out var newLoc);
                SetLoc(newLoc);
                break;
            }
            case "loc": {
                if (!value.TryGetValueAsDreamObject<DreamObjectAtom>(out var newLoc) && !value.IsNull)
                    throw new Exception($"Invalid loc {value}");

                SetLoc(newLoc);
                break;
            }
            case "name":
            case "desc": {
                base.SetVar(varName, value); // Let DreamObjectAtom do its own name/desc handling

                if (varName == "name") {
                    _metaDataComponent.Name = GetDisplayName();
                } else {
                    value.TryGetValueAsString(out string? valueStr);
                    _metaDataComponent.Description = valueStr ?? string.Empty;
                }

                break;
            }
            case "screen_loc":
                value.TryGetValueAsString(out var screenLoc);

                ScreenLoc = screenLoc;
                break;
            case "particles":
                if (value.TryGetValueAsDreamObject<DreamObjectParticles>(out var particles)) {
                    if (_particles == particles)
                        break;

                    _particles?.Owner = null;
                    _particles = particles;
                    _particles.Owner = this;
                } else {
                    _particles?.Owner = null;
                    _particles = null;
                }

                break;
            default:
                base.SetVar(varName, value);
                break;
        }
    }

    public void SetLoc(DreamObjectAtom? loc) {
        Loc = loc;

        if (DreamMapManager.TryGetCellAt(Position.XY, (int)Z, out var oldMapCell))
            oldMapCell.Movables.Remove(this);

        if (loc is DreamObjectArea area) { // Puts the atom on the area's first turf
            loc = null; // Nullspace if we can't find a turf

            // We don't actually keep track of area turfs currently
            // So do the classic BYOND trick of looping through every turf and checking its area :)
            // TODO: Remove this monstrosity
            for (int z = 1; z <= DreamMapManager.Levels; z++) {
                for (int x = 1; x <= DreamMapManager.Size.X; x++) {
                    for (int y = 1; y <= DreamMapManager.Size.Y; y++) {
                        if (!DreamMapManager.TryGetCellAt((x, y), z, out var cell))
                            continue;

                        if (cell.Area == area) {
                            loc = cell.Turf;
                            break;
                        }
                    }
                }
            }
        }

        switch (loc) {
            case DreamObjectTurf turf:
                _transformComponent.Position = new MapCoordinates(turf.X, turf.Y, turf.Z);
                _transformComponent.Parent = DreamMapManager.GetZLevelEntity(turf.Z);
                turf.Cell.Movables.Add(this);
                break;
            case DreamObjectMovable movable:
                _transformComponent.Position = new MapCoordinates(0,0,MapId.Nullspace);
                _transformComponent.Parent = movable.Entity;
                break;
            case null:
                _transformComponent.Position = new MapCoordinates(0,0,MapId.Nullspace);
                _transformComponent.Parent = EntityUid.Invalid;
                break;
            default:
                throw new ArgumentException($"Invalid loc {loc}");
        }
    }

    private void SetScreenLoc(string? screenLoc) {
        _screenLoc = screenLoc;
        AtomManager.SetMovableScreenLoc(this, !string.IsNullOrEmpty(screenLoc) ? new ScreenLocation(screenLoc) : new ScreenLocation(0, 0, 0, 0));
    }
}
