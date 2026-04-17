








namespace OpenDreamClient.States.MainMenu;

[GenerateTypedNameReferences]
public sealed partial class MainMenuControl : Control {
    public LineEdit UserNameBox => UsernameBoxProtected;
    public LineEdit AddressBox => AddressBoxProtected;
    public Button ConnectButton => ConnectButtonProtected;
    public Button QuitButton => QuitButtonProtected;

    public MainMenuControl(IResourceCache resCache, IConfigurationManager configMan) {
        RobustXamlLoader.Load(this);

        Panel.PanelOverride = new StyleBoxFlat(Color.Black);
        WIPLabel.FontOverride = new VectorFont(resCache.GetResource<FontResource>("/Fonts/NotoSans-Bold.ttf"), 32);

        LayoutContainer.SetAnchorPreset(this, LayoutContainer.LayoutPreset.Wide);

        LayoutContainer.SetAnchorPreset(VBox, LayoutContainer.LayoutPreset.Center);
        LayoutContainer.SetGrowHorizontal(VBox, LayoutContainer.GrowDirection.Both);
        LayoutContainer.SetGrowVertical(VBox, LayoutContainer.GrowDirection.Both);

        var logoTexture = resCache.GetResource<TextureResource>("/OpenDream/Logo/logo.png");
        Logo.Texture = logoTexture;

        var currentUserName = configMan.GetCVar(CVars.PlayerName);
        UserNameBox.Text = currentUserName;

        AddressBoxProtected.Text = "127.0.0.1:1212";

#if DEBUG
        DebugWarningLabel.Visible = true;
#endif
    }
}
