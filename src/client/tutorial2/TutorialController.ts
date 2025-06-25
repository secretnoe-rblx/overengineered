import { ContextActionService } from "@rbxts/services";
import { LabelControl } from "client/gui/controls/LabelControl";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { Component } from "engine/shared/component/Component";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { Transforms } from "engine/shared/component/Transforms";
import { Element } from "engine/shared/Element";

const prefab = Interface.getInterface<{
	Help: {
		Tutorial: GuiObject & {
			// readonly Dialog: DialogDefinition;
			readonly Progress: ProgressDefinition;
			readonly Text: HelpTextDefinition;
		};
	};
}>().Help.Tutorial;
prefab.Visible = false;

type ProgressDefinition = GuiObject & {
	readonly Header: TextLabel;
	readonly Content: GuiObject & {
		readonly TextLabel: TextLabel;
		readonly Buttons: GuiObject & {
			readonly Stop: GuiButton;
		};
	};
	readonly Progress: GuiObject & {
		readonly Inner: GuiObject;
	};
};
class Progress extends Control<ProgressDefinition> {
	constructor(gui: ProgressDefinition) {
		super(gui);
		this.gui.Progress.Size = new UDim2(new UDim(0, 0), this.gui.Progress.Size.Y);
	}

	/** Sets the title */
	setTitle(text: string) {
		this.gui.Header.Text = text;
	}
	/** Sets the text */
	setText(text: string) {
		this.gui.Content.TextLabel.Text = text;
	}

	/**
	 * Sets the progress
	 * @argument progress The new progress, 0-1
	 */
	setProgress(progress: number) {
		Transforms.create() //
			.flashColor(this.gui.Progress, new Color3(1, 1, 1))
			.flashColor(this.gui.Progress.Inner, new Color3(1, 1, 1))
			.transform(
				this.gui.Progress,
				"Size",
				new UDim2(new UDim(progress, 0), this.gui.Progress.Size.Y),
				Transforms.quadOut02,
			)
			.run(this.gui.Progress);
	}
}

type HelpTextDefinition = GuiObject & {
	readonly Content: GuiObject & {
		readonly TextLabel: TextLabel;
		readonly Key: GuiObject & {
			readonly Controller: ImageLabel;
			readonly Keyboard: ImageLabel & {
				readonly KeyLabel: TextLabel;
			};
		};
	};
	readonly Buttons: GuiObject & {
		readonly Skip: GuiButton;
		readonly Next: GuiButton;
	};
};
class HelpText extends Control<HelpTextDefinition> {
	private readonly textTemplate;
	private readonly keyTemplate;
	private readonly content;

	constructor(
		gui: HelpTextDefinition,
		private readonly scaledScreen: ScaledScreenGui,
	) {
		super(gui);

		this.content = this.parent(new Control(gui.Content));

		this.textTemplate = this.asTemplate(gui.Content.TextLabel);
		this.keyTemplate = this.asTemplate(gui.Content.Key);

		gui.Buttons.Skip.Visible = gui.Buttons.Next.Visible = false;
	}

	/** Positions this gui around {@link instance}, on its {@link side} with a {@link margin} */
	withPositionAround(instance: GuiObject, side: "right" | "up" | "down" | "left", margin: number = 16): this {
		margin *= 2;

		this.event.loop(0, () => {
			let pos = new Vector2();

			const absolutePos = instance.AbsolutePosition;
			if (side === "right") {
				pos = absolutePos.add(new Vector2(instance.AbsoluteSize.X + margin, instance.AbsoluteSize.Y / 2));
				this.instance.AnchorPoint = new Vector2(0, 0.5);
			} else if (side === "left") {
				pos = absolutePos.add(new Vector2(-margin, instance.AbsoluteSize.Y / 2));
				this.instance.AnchorPoint = new Vector2(1, 0.5);
			} else if (side === "down") {
				pos = absolutePos.add(new Vector2(instance.AbsoluteSize.X / 2, instance.AbsoluteSize.Y + margin));
				this.instance.AnchorPoint = new Vector2(0.5, 0);
			} else if (side === "up") {
				pos = absolutePos.add(new Vector2(instance.AbsoluteSize.X / 2, -margin));
				this.instance.AnchorPoint = new Vector2(0.5, 1);
			}

			this.instance.Position = new UDim2(
				0,
				pos.X / this.scaledScreen.getScale(),
				0,
				pos.Y / this.scaledScreen.getScale(),
			);
		});

		return this;
	}
	/**
	 * Moves this gui to a new position
	 * @argument x New position X, relative to the screen
	 * @argument y New position Y, relative to the screen
	 */
	withRelativePosition(x: number, y: number): this {
		this.instance.Position = new UDim2(x, 0, y, 0);
		return this;
	}

	/** Adds a text line */
	withText(text: string): this {
		const control = this.parent(new LabelControl(this.textTemplate()));
		control.value.set(text);

		return this;
	}

	/** Enables the Next button, which invokes {@link func} upon pressing */
	withNext(func: () => void): this {
		const btnn = this.parent(new Control(this.gui.Buttons.Next)) //
			.addButtonAction(func);
		btnn.setInstanceVisibility(true);

		return this;
	}
}

class TutorialControllerGui extends InstanceComponent<ScreenGui> {
	private readonly scaled;
	readonly progress;

	constructor(gui: ScreenGui) {
		super(gui);

		this.onEnabledStateChange((state) => (gui.Enabled = state));
		this.scaled = this.parent(new ScaledScreenGui(gui));

		this.progress = this.parentGui(new Progress(prefab.Progress.Clone()));
	}

	/** Creates a fullscreen fade control */
	createFullScreenFade() {
		const frame = Element.create("Frame", {
			ZIndex: -9999,
			BorderSizePixel: 0,
			Transparency: 0.5,
			Size: new UDim2(1, 0, 1, 0),
			BackgroundColor3: Color3.fromRGB(0, 0, 0),
			Active: true,
			Parent: this.instance,
		});

		return new Control(frame);
	}
	/** Creates a fullscreen fade control with a hole around {@link gui} + additional margin */
	createFullScreenFadeWithHoleAround(gui: GuiObject, margin: Vector2 = new Vector2(16, 16)) {
		const overlay = new InstanceComponent(
			Element.create("ScreenGui", {
				Name: "overlay",
				DisplayOrder: this.instance.DisplayOrder - 1,
				IgnoreGuiInset: true,
				Parent: this.instance,
			}),
		);

		const addFrame = (color = Color3.fromRGB(0, 0, 0), transparency = 0.5) => {
			return overlay.parentGui(
				new Control(
					Element.create("Frame", {
						ZIndex: -9999,
						BorderSizePixel: 0,
						Transparency: transparency,
						BackgroundColor3: color,
						Active: true,
					}),
				),
			);
		};

		const reposition = (frame: InstanceComponent<GuiObject>, pos: UDim2, size: UDim2) => {
			frame.instance.Position = pos;
			frame.instance.Size = size;
		};

		const color = Color3.fromRGB(255, 0, 0);
		const framesDim = [addFrame(), addFrame(), addFrame(), addFrame()];
		const framesOutline = [addFrame(color, 0), addFrame(color, 0), addFrame(color, 0), addFrame(color, 0)];

		this.event.loop(0, () => {
			let min = gui.AbsolutePosition.sub(margin);
			let max = gui.AbsolutePosition.add(gui.AbsoluteSize).add(margin.mul(2));

			min = min.sub(overlay.instance.AbsolutePosition);
			max = max.sub(overlay.instance.AbsolutePosition);

			reposition(framesDim[0], new UDim2(), new UDim2(1, 0, 0, min.Y));
			reposition(framesDim[1], new UDim2(0, 0, 0, max.Y), new UDim2(1, 0, 1, 0));
			reposition(framesDim[2], new UDim2(0, 0, 0, min.Y), new UDim2(0, min.X, 0, max.Y - min.Y));
			reposition(framesDim[3], new UDim2(0, max.X, 0, min.Y), new UDim2(1, 0, 0, max.Y - min.Y));

			const thickness = 2;
			reposition(framesOutline[0], new UDim2(0, min.X, 0, min.Y), new UDim2(0, max.X - min.X, 0, thickness));
			reposition(framesOutline[1], new UDim2(0, min.X, 0, min.Y), new UDim2(0, thickness, 0, max.Y - min.Y));
			reposition(
				framesOutline[2],
				new UDim2(0, min.X, 0, max.Y),
				new UDim2(0, max.X - min.X + thickness, 0, thickness),
			);
			reposition(framesOutline[3], new UDim2(0, max.X, 0, min.Y), new UDim2(0, thickness, 0, max.Y - min.Y));
		});

		return overlay;
	}

	/** Creates a floating window with ability to add text, or a Next button */
	createText() {
		return this.parent(new HelpText(prefab.Text.Clone(), this.scaled));
	}
}

export class TutorialController extends Component {
	readonly gui;

	constructor() {
		super();

		this.gui = this.parent(
			new TutorialControllerGui(
				Element.create("ScreenGui", {
					Name: "Tutorial",
					DisplayOrder: 99999,
					IgnoreGuiInset: true,
					Parent: Interface.getInterface(),
				}),
			),
		);
	}

	/** Creates a component which disables user input of the provided {@link types} and enables back upon destroy */
	disableInput(types: readonly (Enum.KeyCode | Enum.PlayerActions | Enum.UserInputType)[]): Component {
		const component = new Component();
		ContextActionService.BindActionAtPriority(
			"sink@tutorial",
			() => Enum.ContextActionResult.Sink,
			false,
			math.huge,
			...types,
		);
		component.onDestroy(() => ContextActionService.UnbindAction("sink@tutorial"));

		LocalPlayer.getPlayerModule().GetControls().Disable();
		component.onDestroy(() => LocalPlayer.getPlayerModule().GetControls().Enable());

		return component;
	}

	private static readonly allInputTypes: readonly (Enum.KeyCode | Enum.PlayerActions)[] = [
		...Enum.KeyCode.GetEnumItems(),
		...Enum.PlayerActions.GetEnumItems(),
	];

	/** Creates a component which disables user input and enables back upon destroy */
	disableAllInput(): Component {
		return this.disableInput(TutorialController.allInputTypes);
	}

	/** Creates a component which disables user input except the provided ones and enables back upon destroy */
	disableAllInputExcept(except: readonly Enum.KeyCode[]): Component {
		return this.disableInput(TutorialController.allInputTypes.except(except));
	}

	/** Creates a component which waits until {@link func} returns `true`, then calls {@link thenfunc} */
	waitFor(func: () => boolean | undefined, thenfunc: () => void) {
		const component = new Component();
		component.event.loop(0, () => {
			if (!func()) return;
			thenfunc();
		});

		return component;
	}
}
