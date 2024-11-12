import { RunService, UserInputService } from "@rbxts/services";
import { AutoUIScaledControl } from "client/gui/AutoUIScaledControl";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { HostedService } from "engine/shared/di/HostedService";
import { EventHandler } from "engine/shared/event/EventHandler";
import { ArgsSignal } from "engine/shared/event/Signal";

type TooltipDefinition = GuiObject & {
	readonly TextLabel: TextLabel;
};
class TooltipControl extends Control<TooltipDefinition> {
	showTooltip(text: string) {
		this.show();

		this.instance.TextLabel.Text = "";
		TransformService.cancel(this.instance.TextLabel);
		TransformService.run(this.instance.TextLabel, (tr) =>
			tr.setText(this.instance.TextLabel, text, "Text", Transforms.commonProps.quadOut02),
		);
	}

	hideTooltip() {
		TransformService.cancel(this.instance.TextLabel);
		TransformService.run(this.instance.TextLabel, (tr) =>
			tr
				.setText(this.instance.TextLabel, "", "Text", Transforms.commonProps.quadOut02)
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
		screen.ResetOnSpawn = false;
		screen.IgnoreGuiInset = true;
		screen.ClipToDeviceSafeArea = false;
		screen.SafeAreaCompatibility = Enum.SafeAreaCompatibility.None;
		screen.ScreenInsets = Enum.ScreenInsets.None;
		screen.Parent = Interface.getPlayerGui();

		const screenInstance = this.parent(new InstanceComponent(screen));
		screenInstance.onEnable(() => (screen.Enabled = true));
		screenInstance.onDisable(() => (screen.Enabled = false));

		this.tooltip = new TooltipControl(Interface.getTemplates<{ Tooltip: TooltipDefinition }>().Tooltip.Clone());
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
				tr.move(this.tooltip.instance, getMousePosition(), {
					...Transforms.commonProps.quadOut02,
					duration: 0.1,
				}),
			);
		});
	}

	private showTooltip(gui: GuiObject, text: string) {
		// delayig to allow hideTooltip to be executed first
		task.delay(0, () => {
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

	registerControl(
		control: { readonly instance: GuiObject; onDestroy(func: () => void): void },
		text: string | (() => string | undefined),
	): SignalConnection {
		let eh: EventHandler = new EventHandler();

		eh.subscribe(control.instance.MouseEnter, () => {
			if (!control.instance.Interactable) return;

			const txt = typeIs(text, "function") ? text() : text;
			if (!txt) return;

			this.showTooltip(control.instance, txt);
		});
		eh.subscribe(control.instance.MouseLeave, () => this.hideTooltip());

		const hideIfShown = () => {
			if (this.currentObject !== control.instance) {
				return;
			}

			this.hideTooltip();
		};
		const stop = () => {
			hideIfShown();

			eh?.unsubscribeAll();
			eh = undefined!;
		};
		control.onDestroy(stop);
		this.onDestroy(stop);

		return ArgsSignal.connection(stop);
	}
}

export namespace Tooltip {
	let instance: TooltipController | undefined;

	/** Initialize a tooltip at the control */
	export function init(...args: Parameters<TooltipController["registerControl"]>): SignalConnection {
		instance ??= new TooltipController();

		instance.enable();
		return instance.registerControl(...args);
	}
}
