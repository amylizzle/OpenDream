using OpenDreamClient.Input;
using OpenDreamClient.Interface.Descriptors;
using OpenDreamShared.Dream;
using Robust.Client.UserInterface;
using Robust.Client.UserInterface.Controls;
using Robust.Shared.Input;
using Robust.Shared.Map;

namespace OpenDreamClient.Interface.Controls;

public sealed class ControlMap : InterfaceControl {
    public ScalingViewport Viewport { get; private set; }

    [Dependency] private readonly IEntitySystemManager _entitySystemManager = default!;
    [Dependency] private readonly IEntityManager _entityManager = default!;
    private MouseInputSystem _mouseInput;

    public ControlMap(ControlDescriptor controlDescriptor, ControlWindow window) : base(controlDescriptor, window) { }

    protected override void UpdateElementDescriptor() {
        base.UpdateElementDescriptor();

        ControlDescriptorMap mapDescriptor = (ControlDescriptorMap)ElementDescriptor;

        Viewport.StretchMode = mapDescriptor.ZoomMode switch {
            "blur" => ScalingViewportStretchMode.Bilinear,
            "distort" => ScalingViewportStretchMode.Nearest,

            // TODO: "tries to keep the look of individual pixels,
            //          but will adjust to non-integer zooms (like 1.1x) by blending neighboring pixels"
            "normal" or _ => ScalingViewportStretchMode.Nearest
        };
    }

    public void UpdateViewRange(ViewRange view) {
        Viewport.ViewportSize = (Math.Max(view.Width, 1) * 32, Math.Max(view.Height, 1) * 32);
    }

    protected override Control CreateUIElement() {
        Viewport = new ScalingViewport { MouseFilter = Control.MouseFilterMode.Stop };
        Viewport.OnKeyBindDown += OnViewportKeyBindDown;
        Viewport.AfterDrawEvent += OnViewportHover;

        Viewport.OnVisibilityChanged += (args) => {
            if (args.Visible) {
                OnShowEvent();
            } else {
                OnHideEvent();
            }
        };
        if(ControlDescriptor.IsVisible)
            OnShowEvent();
        else
            OnHideEvent();

        UpdateViewRange(_interfaceManager.View);

        return new PanelContainer { StyleClasses = {"MapBackground"}, Children = { Viewport } };
    }

    private void OnViewportKeyBindDown(GUIBoundKeyEventArgs e) {
        if (e.Function == EngineKeyFunctions.Use || e.Function == EngineKeyFunctions.TextCursorSelect ||
            e.Function == EngineKeyFunctions.UIRightClick || e.Function == OpenDreamKeyFunctions.MouseMiddle) {
            _entitySystemManager.Resolve(ref _mouseInput);

            if (_mouseInput.HandleViewportClick(Viewport, e)) {
                e.Handle();
            }
        }
    }

    private void OnViewportHover(ScreenCoordinates e) {
        _entitySystemManager.Resolve(ref _mouseInput);

        EntityUid? hovered = _mouseInput.HandleViewportHover(Viewport, e);
        if(hovered != null) {
            ControlDescriptorMap controlDescriptor = (ControlDescriptorMap)ControlDescriptor;
            if (controlDescriptor.OnStatusCommand != null) {
                string hoverstring = "";
                if (_entityManager.TryGetComponent(hovered, out MetaDataComponent? _entityMetaData)) {
                    hoverstring = _entityMetaData.EntityName;
                }
                _interfaceManager.RunCommand(controlDescriptor.OnStatusCommand.Replace("[[*]]", hoverstring));
            }
        }

    }

    public void OnShowEvent() {
        ControlDescriptorMap controlDescriptor = (ControlDescriptorMap)ControlDescriptor;
        if (controlDescriptor.OnShowCommand != null) {
            _interfaceManager.RunCommand(controlDescriptor.OnShowCommand);
        }
    }

    public void OnHideEvent() {
        ControlDescriptorMap controlDescriptor = (ControlDescriptorMap)ControlDescriptor;
        if (controlDescriptor.OnHideCommand != null) {
            _interfaceManager.RunCommand(controlDescriptor.OnHideCommand);
        }
    }
}
