import { StarterGui, UserInputService } from "@rbxts/services";
import { LoadingController } from "client/controller/LoadingController";
import { SoundController } from "client/controller/SoundController";
import { DictionaryControl } from "client/gui/controls/DictionaryControl";
import { Control } from "engine/client/gui/Control";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { Colors } from "shared/Colors";
import type { ToolBase } from "client/tools/ToolBase";
import type { ToolController } from "client/tools/ToolController";

export type HotbarToolButtonControlDefinition = TextButton & {
	readonly ImageLabel: ImageLabel;
	readonly NumLabel: TextLabel;
};

export class HotbarButtonControl extends Control<HotbarToolButtonControlDefinition> {
	constructor(gui: HotbarToolButtonControlDefinition, tools: ToolController, tool: ToolBase, index: number) {
		super(gui);

		this.gui.Name = tool.getDisplayName();
		this.gui.ImageLabel.Image = tool.getImageID();
		this.gui.NumLabel.Text = tostring(index);

		this.event.subscribe(this.gui.Activated, () => {
			if (LoadingController.isLoading.get()) return;
			tools.selectedTool.set(tool === tools.selectedTool.get() ? undefined : tool);
		});

		const selectedToolStateMachine = TransformService.multi(
			TransformService.boolStateMachine(
				this.gui,
				TransformService.commonProps.quadOut02,
				{ BackgroundColor3: Colors.newGui.blue },
				{ BackgroundColor3: Colors.newGui.staticBackground },
			),
		);
		this.event.subscribeObservable(
			tools.selectedTool,
			(newtool) => selectedToolStateMachine(newtool === tool),
			true,
		);
	}
}

export type HotbarControlDefinition = GuiObject & {
	readonly Tools: GuiObject & {
		readonly GamepadLeft: Frame & { ImageLabel: ImageLabel };
		readonly GamepadRight: Frame & { ImageLabel: ImageLabel };
		readonly ToolTemplate: HotbarToolButtonControlDefinition;
	};
	readonly NameLabel: TextLabel;
};

export class HotbarControl extends Control<HotbarControlDefinition> {
	private readonly tools;
	private readonly nameLabel;

	constructor(tools: ToolController, gui: HotbarControlDefinition) {
		super(gui);
		this.tools = tools;

		// Disable roblox native backpack
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false);

		const template = this.asTemplate(this.gui.Tools.ToolTemplate);
		const toolButtons = new DictionaryControl<GuiObject, ToolBase, HotbarButtonControl>(this.gui.Tools);
		this.add(toolButtons);

		this.nameLabel = this.add(new Control(this.gui.NameLabel));

		this.event.subscribeObservable(
			tools.visibleTools.enabled,
			(visible) => {
				toolButtons.clear();

				let index = 0;
				for (const tool of tools.allToolsOrdered) {
					if (!visible.includes(tool)) {
						continue;
					}

					const button = new HotbarButtonControl(template(), tools, tool, ++index);
					toolButtons.keyedChildren.add(tool, button);
				}
			},
			true,
		);
		this.event.subscribeObservable(
			tools.enabledTools.enabled,
			(enabled) => {
				for (const [tool, control] of toolButtons.keyedChildren.getAll()) {
					const isenabled = enabled.includes(tool);

					control.instance.BackgroundTransparency = isenabled ? 0.2 : 0.6;
					control.instance.Active = isenabled;
					control.instance.Interactable = isenabled;
					control.instance.AutoButtonColor = isenabled;
				}
			},
			true,
		);

		this.event.onPrepare((inputType) => {
			for (const button of toolButtons.keyedChildren.getAll()) {
				button[1].instance.NumLabel.Visible = inputType === "Desktop";
			}

			this.gui.Tools.GamepadLeft.Visible = inputType === "Gamepad";
			this.gui.Tools.GamepadRight.Visible = inputType === "Gamepad";
		});

		this.event.onPrepareGamepad(() => {
			this.gui.Tools.GamepadLeft.ImageLabel.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonL1);
			this.gui.Tools.GamepadRight.ImageLabel.Image = UserInputService.GetImageForKeyCode(Enum.KeyCode.ButtonR1);
		});

		this.event.subscribeObservable(tools.selectedTool, (tool, prev) => this.toolChanged(tool, prev));
		this.resetLabels();
	}

	private readonly visibilityFunction = TransformService.boolStateMachine(
		this.gui,
		TransformService.commonProps.quadOut02,
		{ AnchorPoint: new Vector2(0.5, 1) },
		{ AnchorPoint: new Vector2(0.5, 0) },
		(tr, enabled) => (enabled ? tr.func(() => super.setInstanceVisibilityFunction(true)) : 0),
		(tr, enabled) => (enabled ? 0 : tr.func(() => super.setInstanceVisibilityFunction(false))),
	);
	protected setInstanceVisibilityFunction(visible: boolean): void {
		this.visibilityFunction(visible);
	}

	private toolChanged(tool: ToolBase | undefined, prev: ToolBase | undefined) {
		const duration = tool && prev ? 0.07 : 0.15;

		const transform = Transforms.create();
		if (prev) {
			transform
				.moveY(this.nameLabel.instance, new UDim(0, 0), { duration })
				.transform(this.nameLabel.instance, "TextTransparency", 1, { duration: duration * 0.8 });
		}

		transform //
			.then()
			.func(() => (this.instance.NameLabel.Text = tool?.getDisplayName() ?? ""));

		if (tool) {
			transform
				.then()
				.moveY(this.nameLabel.instance, new UDim(1, 0))
				.transform(this.nameLabel.instance, "TextTransparency", 1)
				.moveY(this.nameLabel.instance, new UDim(0.05, 0), { duration })
				.transform(this.nameLabel.instance, "TextTransparency", 0, { duration: duration * 0.8 })
				.then();
		}
		transform.run(this.nameLabel.instance);

		// Play sound
		SoundController.getSounds().Click.Play();
	}

	private resetLabels() {
		this.instance.NameLabel.Text = "";
	}
}
