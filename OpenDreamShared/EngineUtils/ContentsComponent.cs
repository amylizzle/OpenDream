using System.Collections.Generic;

namespace OpenDreamShared.EngineUtils;

public sealed partial class ContentsComponent : Component {
    [AutoNetworkedField] public HashSet<EntityUid> Contents;

    public int ChildCount => Contents.Count;
    public IEnumerator<EntityUid> ChildEnumerator => Contents.GetEnumerator();

    public ContentsComponent() {
        Contents = new();
    }
}
