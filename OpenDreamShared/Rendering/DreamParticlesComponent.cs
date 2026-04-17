using System.Numerics;
using OpenDreamShared.Dream;






namespace OpenDreamShared.Rendering;

[RegisterComponent, NetworkedComponent, AutoGenerateComponentState(true)]
public sealed partial class DreamParticlesComponent : Component {
    [AutoNetworkedField] public int Width;
    [AutoNetworkedField] public int Height;
    [AutoNetworkedField] public int Count;
    [AutoNetworkedField] public float Spawning;
    [AutoNetworkedField] public Vector3 Bound1;
    [AutoNetworkedField] public Vector3 Bound2;
    [AutoNetworkedField] public Vector3 Gravity;
    [AutoNetworkedField] public Color[] Gradient = [];
    [AutoNetworkedField] public Matrix3x2 Transform;
    [AutoNetworkedField] public ImmutableAppearance[] TextureList = [];
    [AutoNetworkedField] public IGeneratorNum? Lifespan;
    [AutoNetworkedField] public IGeneratorNum? FadeIn;
    [AutoNetworkedField] public IGeneratorNum? FadeOut;

    [AutoNetworkedField] public IGeneratorVector? SpawnPosition;

	//Starting velocity of the particles
    [AutoNetworkedField] public IGeneratorVector? SpawnVelocity;

	//Acceleration applied to the particles per second
    [AutoNetworkedField] public IGeneratorVector? Friction;

	//Scaling applied to the particles in (x,y)
    [AutoNetworkedField] public IGeneratorVector Scale = new GeneratorNum(1);

	//Rotation applied to the particles in degrees
    [AutoNetworkedField] public IGeneratorNum? Rotation;

	//Increase in scale per second
    [AutoNetworkedField] public IGeneratorVector? Growth;

	//Change in rotation per second
    [AutoNetworkedField] public IGeneratorNum? Spin;
    [AutoNetworkedField] public IGeneratorVector? Drift;
}
