import { RunService, UserInputService } from "@rbxts/services";
import { AutoUIScaledControl } from "client/gui/AutoUIScaledControl";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import { InstanceComponent } from "shared/component/InstanceComponent";
import { TransformService } from "shared/component/TransformService";
import { EventHandler } from "shared/event/EventHandler";
import { HostedService } from "shared/GameHost";

type TooltipDefinition = GuiObject & {
	readonly TextLabel: TextLabel;
};
class TooltipControl extends Control<TooltipDefinition> {
	showTooltip(text: string) {
		this.show();

		this.instance.TextLabel.Text = "";
		TransformService.cancel(this.instance.TextLabel);
		TransformService.run(this.instance.TextLabel, (tr) =>
			tr.setText(text, "Text", TransformService.commonProps.quadOut02),
		);
	}

	hideTooltip() {
		TransformService.cancel(this.instance.TextLabel);
		TransformService.run(this.instance.TextLabel, (tr) =>
			tr
				.setText("", "Text", TransformService.commonProps.quadOut02)
				.then()
				.func(() => this.hide()),
		);
	}
}

class TooltipController extends HostedService {
	private readonly tooltip: TooltipControl;
	private currentObject?: GuiObject;

	constructor() {
		super();

		const screen = new Instance("ScreenGui");
		screen.Name = "TooltipScreen";
		screen.IgnoreGuiInset = true;
		screen.ClipToDeviceSafeArea = false;
		screen.SafeAreaCompatibility = Enum.SafeAreaCompatibility.None;
		screen.ScreenInsets = Enum.ScreenInsets.None;
		screen.Parent = Gui.getPlayerGui();

		const screenInstance = this.parent(new InstanceComponent(screen));
		screenInstance.onEnable(() => (screen.Enabled = true));
		screenInstance.onDisable(() => (screen.Enabled = false));

		this.tooltip = new TooltipControl(Gui.getTemplates<{ Tooltip: TooltipDefinition }>().Tooltip.Clone());
		this.tooltip.instance.Parent = screen;
		this.tooltip.hide();
		this.onDestroy(() => this.tooltip.destroy());

		this.parent(new AutoUIScaledControl(this.tooltip.instance));

		const getMousePosition = () => {
			const mousePos = UserInputService.GetMouseLocation();
			return new UDim2(0, mousePos.X + 10, 0, mousePos.Y - 20);
		};

		this.tooltip.onEnable(() => (this.tooltip.instance.Position = getMousePosition()));
		this.event.subscribe(RunService.Heartbeat, () => {
			if (!this.tooltip.isVisible()) return;

			TransformService.cancel(this.tooltip.instance);
			TransformService.run(this.tooltip.instance, (tr) =>
				tr.move(getMousePosition(), {
					...TransformService.commonProps.quadOut02,
					duration: 0.1,
				}),
			);
		});
	}

	private showTooltip(gui: GuiObject, text: string) {
		// delayig to allow hideTooltip to be executed first
		task.delay(0.1, () => {
			this.currentObject = gui;

			task.delay(0.4, () => {
				if (this.currentObject !== gui) return;
				this.tooltip.showTooltip(text);
			});
		});
	}
	private hideTooltip() {
		this.currentObject = undefined;
		this.tooltip.hideTooltip();
	}

	registerControl(control: Control, text: string | (() => string | undefined)) {
		let eh: EventHandler = new EventHandler();

		eh.subscribe(control.instance.MouseEnter, () => {
			const txt = typeIs(text, "function") ? text() : text;
			if (!txt) return;

			this.showTooltip(control.instance, txt);
		});
		eh.subscribe(control.instance.MouseLeave, () => this.hideTooltip());

		control.onDestroy(() => {
			eh?.unsubscribeAll();
			eh = undefined!;
		});
		this.onDestroy(() => {
			eh?.unsubscribeAll();
			eh = undefined!;
		});
	}
}

export namespace Tooltip {
	let instance: TooltipController | undefined;

	/** Initialize a tooltip at the control */
	export function init(...args: Parameters<TooltipController["registerControl"]>): void {
		instance ??= new TooltipController();

		instance.enable();
		instance.registerControl(...args);
	}
}
