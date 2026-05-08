using System.Numerics;
using OpenDreamShared.Dream;
using OpenDreamShared.EngineUtils;

namespace OpenDreamShared.Rendering;

public sealed partial class DreamParticlesComponent : Component {
    [AutoNetworkedField] public partial int Width {get;set;}
    [AutoNetworkedField] public partial int Height {get;set;}
    [AutoNetworkedField] public partial int Count {get;set;}
    [AutoNetworkedField] public partial float Spawning {get;set;}
    [AutoNetworkedField] public partial Vector3 Bound1 {get;set;}
    [AutoNetworkedField] public partial Vector3 Bound2 {get;set;}
    [AutoNetworkedField] public partial Vector3 Gravity {get;set;}
    [AutoNetworkedField] public partial Color[]? Gradient {get;set;}
    [AutoNetworkedField] public partial Matrix3x2 Transform {get;set;}
    [AutoNetworkedField] public partial ImmutableAppearance[]? TextureList {get;set;}
    [AutoNetworkedField] public partial IGeneratorNum? Lifespan {get;set;}
    [AutoNetworkedField] public partial IGeneratorNum? FadeIn {get;set;}
    [AutoNetworkedField] public partial IGeneratorNum? FadeOut {get;set;}

    [AutoNetworkedField] public partial IGeneratorVector? SpawnPosition {get;set;}

	//Starting velocity of the particles
    [AutoNetworkedField] public partial IGeneratorVector? SpawnVelocity {get;set;}

	//Acceleration applied to the particles per second
    [AutoNetworkedField] public partial IGeneratorVector? Friction {get;set;}

	//Scaling applied to the particles in (x,y)
    [AutoNetworkedField] public partial IGeneratorVector? Scale {get;set;}

	//Rotation applied to the particles in degrees
    [AutoNetworkedField] public partial IGeneratorNum? Rotation {get;set;}

	//Increase in scale per second
    [AutoNetworkedField] public partial IGeneratorVector? Growth {get;set;}

	//Change in rotation per second
    [AutoNetworkedField] public partial IGeneratorNum? Spin {get;set;}
    [AutoNetworkedField] public partial IGeneratorVector? Drift {get;set;}
}
