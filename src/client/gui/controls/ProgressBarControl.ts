import { Control } from "engine/client/gui/Control";
import { PartialControl } from "engine/client/gui/PartialControl";
import { NumberObservableValue } from "engine/shared/event/NumberObservableValue";

export type ProgressBarControlDefinition = GuiObject & ProgressBarControlDefinitionParts;
export type ProgressBarControlDefinitionParts = {
	readonly Filled?: GuiObject;
	readonly Text?: TextLabel;
	readonly Knob?: GuiObject;
};

/** Control that represents a number as a progress bar. */
export class ProgressBarControl extends PartialControl<ProgressBarControlDefinitionParts> {
	readonly value;
	readonly vertical;

	constructor(gui: GuiObject, min: number, max: number, step?: number, parts?: ProgressBarControlDefinitionParts) {
		super(gui, parts);

		this.value = new NumberObservableValue(min, min, max, step);
		this.vertical = this.getAttribute<boolean>("Vertical") === true;

		this.subscribeVisual();
	}

	private subscribeVisual() {
		if (this.parts.Text) {
			const text = this.parts.Text;
			this.event.subscribeObservable(this.value, (value) => (text.Text = tostring(value)), true);
		}

		if (this.parts.Knob) {
			const knob = this.parent(new Control(this.parts.Knob));
			knob.valuesComponent()
				.get("Position")
				.addChildOverlay(
					this.value.createBased((value) => {
						const pos = (value - this.value.min) / this.value.getRange();
						return new UDim2(this.vertical ? 0.5 : pos, 0, this.vertical ? pos : 0.5, 0);
					}),
				)
				.addBasicTransform({ duration: 0.1 });
		}

		if (this.parts.Filled) {
			const filled = this.parent(new Control(this.parts.Filled));
			filled
				.valuesComponent()
				.get("Size")
				.addChildOverlay(
					this.value.createBased((value) => {
						const pos = (value - this.value.min) / this.value.getRange();
						return new UDim2(this.vertical ? 1 : pos, 0, this.vertical ? pos : 1, 0);
					}),
				)
				.addBasicTransform({ duration: 0.1 });
		}
	}
}
