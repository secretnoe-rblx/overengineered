import { ReplicatedStorage, StarterGui, UserInputService, Workspace } from "@rbxts/services";
import { ButtonControl } from "client/gui/controls/Button";
import { Interface } from "client/gui/Interface";
import { HostedService } from "engine/shared/di/HostedService";
import { Element } from "engine/shared/Element";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { Topbar } from "client/gui/Topbar";

@injectable
export class HideInterfaceController extends HostedService {
	private readonly _visible = new ObservableValue(true);
	readonly visible = this._visible.asReadonly();

	private readonly guis = [Interface.getGameUI(), Interface.getUnscaledGameUI(), Interface.getInterface()] as const;
	private currentUnhideScreen?: ScreenGui;

	constructor(@inject topbar: Topbar) {
		super();

		this.event.subscribeObservable(this._visible, (visible) => {
			if (visible) {
				this.currentUnhideScreen?.Destroy();
				this.currentUnhideScreen = undefined;
			}
		});

		this.event.subscribe(UserInputService.InputBegan, (input) => {
			if (input.UserInputType !== Enum.UserInputType.Keyboard) {
				return;
			}

			if (UserInputService.GetFocusedTextBox()) {
				return;
			}

			if (!input.IsModifierKeyDown("Shift") || !UserInputService.IsKeyDown(Enum.KeyCode.G)) {
				return;
			}

			this._visible.set(!this._visible.get());
		});

		this._visible.subscribe((visible) => {
			// hide screen guis
			for (const ui of this.guis) {
				ui.Enabled = visible;
			}

			// Hide core gui (excluding backpack)
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, visible);
			StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

			// Plot owner gui hide
			Workspace.Plots.GetChildren().forEach((plot) => {
				const ownerGui = plot.FindFirstChild(ReplicatedStorage.Assets.PlotOwnerGui.Name) as
					| BillboardGui
					| undefined;
				if (ownerGui) {
					ownerGui.Enabled = visible;
				}
			});
		});

		const hideButton = topbar.getRightButtonsGui<{ readonly Hide: GuiButton }>("Common").Hide;
		this.parent(new ButtonControl(hideButton, () => this.hide(hideButton))).show();
	}

	private createUnhideGui(button: GuiButton): ScreenGui {
		const ghost = button.Clone();
		ghost.Transparency = 0.8;
		ghost.Position = new UDim2(0, button.AbsolutePosition.X, 0, button.AbsolutePosition.Y);
		ghost.Size = new UDim2(0, button.AbsoluteSize.X, 0, button.AbsoluteSize.Y);
		ghost.AnchorPoint = Vector2.zero;

		new ButtonControl(ghost, () => this._visible.set(true)).show();

		const screen = Element.create("ScreenGui", { Name: "UnhideScreenGui" }, { ghost });
		screen.Parent = Interface.getPlayerGui();

		return screen;
	}

	/**
	 * Hide the whole game interface.
	 * @param button If not nil, uses this to create a ghost that on click will restore the visibility (for mobile devices which don't have any physical buttons)
	 */
	hide(button: GuiButton | undefined) {
		if (button) {
			this.currentUnhideScreen = this.createUnhideGui(button);
		}

		this._visible.set(false);
	}
}
