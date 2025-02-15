import { ColorVisualizerWithAlpha } from "client/gui/ColorVisualizerWithAlpha";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { SliderControl } from "client/gui/controls/SliderControl";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { TextBoxControl } from "engine/client/gui/TextBoxControl";
import { Colors } from "engine/shared/Colors";
import { Transforms } from "engine/shared/component/Transforms";
import { Observables } from "engine/shared/event/Observables";
import { ArgsSignal } from "engine/shared/event/Signal";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import type { SliderControlDefinition } from "client/gui/controls/SliderControl";
import type { ReadonlyArgsSignal } from "engine/shared/event/Signal";

export type Color4ChooserDefinition = GuiObject & {
	readonly Preview: GuiObject & {
		readonly UIGradient?: UIGradient;
	};
	readonly Sliders: GuiObject & {
		readonly QuickAction?: GuiObject & {
			readonly ResetButton: GuiButton;
			readonly SelectButton: GuiButton;
		};
		readonly Hue: SliderControlDefinition & {
			readonly UIGradient: UIGradient;
		};
		readonly Saturation: SliderControlDefinition & {
			readonly UIGradient: UIGradient;
		};
		readonly Brightness: SliderControlDefinition & {
			readonly UIGradient: UIGradient;
		};
		readonly Alpha?: SliderControlDefinition & {
			readonly UIGradient: UIGradient;
		};
	};
	readonly Inputs: GuiObject & {
		readonly ManualRed: TextBox;
		readonly ManualGreen: TextBox;
		readonly ManualBlue: TextBox;
		readonly ManualAlpha?: TextBox;
		readonly ManualHex: TextBox;
	};
};

class ColorChooserSliders extends Control<Color4ChooserDefinition["Sliders"]> {
	private readonly _value = SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
	readonly value = this._value.asHalfReadonly();
	readonly moved: ReadonlyArgsSignal<[color: Color3]>;

	private readonly sliders;
	private setBySelf = false;

	constructor(gui: Color4ChooserDefinition["Sliders"]) {
		super(gui);

		const moved = new ArgsSignal<[color: Color3]>();
		this.moved = moved;

		const updateSliderColors = () => {
			const [h, s, v] = [hue.value.get(), sat.value.get(), bri.value.get()];

			gui.Saturation.UIGradient.Color = new ColorSequence(Color3.fromHSV(h, 0, v), Color3.fromHSV(h, 1, v));
			gui.Brightness.UIGradient.Color = new ColorSequence(
				gui.Brightness.UIGradient.Color.Keypoints[0].Value,
				Color3.fromHSV(h, s, 1),
			);

			if (Control.exists(gui, "Alpha")) {
				gui.Alpha.UIGradient.Color = new ColorSequence(Color3.fromHSV(h, s, v));
			}
		};
		this.onEnable(updateSliderColors);

		const getColorFromSliders = () => Color3.fromHSV(hue.value.get(), sat.value.get(), bri.value.get());
		const createSlider = <T extends SliderControlDefinition>(gui: T) => {
			const slider = new SliderControl(gui, { min: 0, max: 1, step: 1 / 255 });
			slider.submitted.Connect(() => {
				this.setBySelf = true;
				this._value.submit(getColorFromSliders());
				this.setBySelf = false;
			});
			slider.moved.Connect(() => {
				this.setBySelf = true;
				moved.Fire(getColorFromSliders());
				this.setBySelf = false;
			});
			slider.value.subscribe(updateSliderColors);
			this.parent(slider);

			return slider;
		};

		const hue = createSlider(this.gui.Hue);
		const sat = createSlider(this.gui.Saturation);
		const bri = createSlider(this.gui.Brightness);
		this.sliders = { hue, sat, bri } as const;

		this.value.value.subscribe((value) => {
			if (this.setBySelf) return;

			const [h, s, v] = value.ToHSV();
			this.sliders.hue.value.set(h);
			this.sliders.sat.value.set(s);
			this.sliders.bri.value.set(v);
		}, true);
	}
}
class ColorChooserInputs extends Control<Color4ChooserDefinition["Inputs"]> {
	private readonly _value = SubmittableValue.from<Color3>(Color3.fromRGB(255, 255, 255));
	readonly value = this._value.asHalfReadonly();

	constructor(gui: Color4ChooserDefinition["Inputs"]) {
		super(gui);

		const getColorFromRgbTextBoxes = () => Color3.fromRGB(rtext.value.get(), gtext.value.get(), btext.value.get());
		const submitFromRgb = () => this._value.submit(getColorFromRgbTextBoxes());

		const rtext = this.parent(new NumberTextBoxControl(this.gui.ManualRed, 0, 255, 1));
		const gtext = this.parent(new NumberTextBoxControl(this.gui.ManualGreen, 0, 255, 1));
		const btext = this.parent(new NumberTextBoxControl(this.gui.ManualBlue, 0, 255, 1));

		this.event.subscribe(rtext.submitted, submitFromRgb);
		this.event.subscribe(gtext.submitted, submitFromRgb);
		this.event.subscribe(btext.submitted, submitFromRgb);

		const hextext = this.parent(new TextBoxControl(this.gui.ManualHex));
		this.event.subscribe(hextext.submitted, (hex) => {
			try {
				this._value.submit(Color3.fromHex(hex));
			} catch {
				hextext.text.set("#" + getColorFromRgbTextBoxes().ToHex().upper());
				Transforms.create() //
					.flashColor(hextext.instance, Colors.red)
					.run(hextext.instance);
			}
		});

		this.value.value.subscribe((value) => {
			rtext.value.set(math.floor(value.R * 255));
			gtext.value.set(math.floor(value.G * 255));
			btext.value.set(math.floor(value.B * 255));
			hextext.text.set("#" + value.ToHex().upper());
		}, true);
	}
}

export class Color4Chooser extends Control<Color4ChooserDefinition> {
	readonly value;

	constructor(gui: Color4ChooserDefinition, value?: SubmittableValue<Color4>, allowAlpha = false) {
		super(gui);

		if (Control.exists(gui.Inputs, "ManualAlpha")) {
			gui.Inputs.ManualAlpha.Visible = allowAlpha;
		}
		if (Control.exists(gui.Sliders, "Alpha")) {
			gui.Sliders.Alpha.Visible = allowAlpha;
		}

		value ??= SubmittableValue.from<Color4>({
			alpha: 0.5,
			color: Color3.fromRGB(255, 255, 255),
		});
		this.value = value.asHalfReadonly();

		if (Control.exists(gui.Sliders, "QuickAction")) {
			this.add(
				new ButtonControl(gui.Sliders.QuickAction.ResetButton, () => {
					value.set({ color: Colors.black, alpha: 1 });
					value.submit({ color: Colors.black, alpha: 1 });
				}),
			);

			this.add(
				BlockPipetteButton.forColor(gui.Sliders.QuickAction.SelectButton, (color) => {
					value.set({ alpha: value.get().alpha, color });
					value.submit({ alpha: value.get().alpha, color });
				}),
			);
		}

		const sliders = this.add(new ColorChooserSliders(gui.Sliders));
		sliders.moved.Connect((v) => {
			value.set({ alpha: value.get().alpha, color: v });
			inputs.value.set(v);
		});
		sliders.value.submitted.Connect((v) => {
			value.set({ alpha: value.get().alpha, color: v });
			inputs.value.set(v);
			value.submit({ alpha: value.get().alpha, color: v });
		});

		const inputs = this.parent(new ColorChooserInputs(gui.Inputs));
		inputs.value.submitted.Connect((v) => {
			value.set({ alpha: value.get().alpha, color: v });
			sliders.value.set(v);
			value.submit({ alpha: value.get().alpha, color: v });
		});

		this.event.subscribeObservable(
			value.value,
			({ color }) => {
				inputs.value.set(color);
				sliders.value.set(color);
			},
			true,
			true,
		);

		if (Control.exists(this.gui.Inputs, "ManualAlpha") && Control.exists(this.gui.Sliders, "Alpha")) {
			const alphaSlider = this.parent(
				new SliderControl(
					this.gui.Sliders.Alpha,
					{ min: 0, max: 1, inputStep: 0.01 },
					{ TextBox: this.gui.Inputs.ManualAlpha },
				),
			);
			this.event
				.addObservable(Observables.createObservableFromObjectPropertyTyped(value.value, ["alpha"]))
				.connect(alphaSlider.value);
			alphaSlider.submitted.Connect((v) => value.submit({ alpha: v, color: value.get().color }));
			alphaSlider.moved.Connect((v) => value.set({ alpha: v, color: value.get().color }));
		}

		if (Control.exists(this.gui.Preview, "UIGradient")) {
			this.parent(new ColorVisualizerWithAlpha(this.gui.Preview, value.value));
		}
	}
}
