import { Control } from "engine/client/gui/Control";
import { TextBoxComponent } from "engine/client/gui/TextBoxControl";
import { Colors } from "engine/shared/Colors";
import { Transforms } from "engine/shared/component/Transforms";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { SubmittableValue } from "engine/shared/event/SubmittableValue";
import { Color4 } from "shared/Color4";
import type { ReadonlySubmittableValue } from "engine/shared/event/SubmittableValue";

export type Color4TextBoxDefinition = TextBox;
export class Color4TextBox extends Control<Color4TextBoxDefinition> {
	readonly value: ReadonlySubmittableValue<Color4>;

	constructor(gui: Color4TextBoxDefinition, value?: SubmittableValue<Color4>, allowAlpha: boolean = true) {
		super(gui);

		value ??= new SubmittableValue<Color4>(new ObservableValue<Color4>({ alpha: 1, color: Colors.white }));
		this.value = value;

		const tb = this.getComponent(TextBoxComponent);
		this.event.subscribeObservable(value.value, (v) => tb.text.set(`#${Color4.toHex(v).upper()}`), true);

		this.event.subscribe(tb.submitted, (hex) => {
			try {
				value.submit(Color4.fromHex(hex));
			} catch {
				tb.text.set(`#${Color4.toHex(value.get()).upper()}`);

				Transforms.create() //
					.flashColor(this.instance, Colors.red)
					.run(this.instance);
			}
		});
	}
}
