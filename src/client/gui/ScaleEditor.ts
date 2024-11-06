import { NumberTextBoxControl } from "client/gui/controls/NumberTextBoxControl";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";

type NumberControlDefinition = GuiObject & {
	readonly SubButton: GuiButton;
	readonly AddButton: GuiButton;
	readonly ValueTextBox: TextBox;
};
class NumberControl extends Control<NumberControlDefinition> {
	constructor(gui: NumberControlDefinition, value: ObservableValue<number>) {
		super(gui);

		this.add(new ButtonControl(gui.AddButton, () => value.set(value.get() + 1)));
		this.add(new ButtonControl(gui.SubButton, () => value.set(value.get() - 1)));
		this.add(new NumberTextBoxControl(gui.ValueTextBox, value));
	}
}

export type ScaleEditorControlDefinition = GuiObject & {
	readonly ScaleXControl: NumberControlDefinition;
	readonly ScaleYControl: NumberControlDefinition;
	readonly ScaleZControl: NumberControlDefinition;
};
export class ScaleEditorControl extends Control<ScaleEditorControlDefinition> {
	constructor(gui: ScaleEditorControlDefinition, scale: ObservableValue<Vector3>) {
		super(gui);

		const createVectorNum = (axis: "X" | "Y" | "Z"): ObservableValue<number> => {
			const value = scale.createBothWayBased<number>(
				(v) =>
					new Vector3(
						axis === "X" ? v : scale.get().X,
						axis === "Y" ? v : scale.get().Y,
						axis === "Z" ? v : scale.get().Z,
					),
				(v) => v[axis],
			);

			return value;
		};

		this.add(new NumberControl(gui.ScaleXControl, createVectorNum("X")));
		this.add(new NumberControl(gui.ScaleYControl, createVectorNum("Y")));
		this.add(new NumberControl(gui.ScaleZControl, createVectorNum("Z")));
	}
}
