import { AutoUIScaledControl } from "engine/client/gui/AutoUIScaledControl";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

export class ScaledScreenGui<T extends ScreenGui> extends AutoUIScaledControl {
	static initializeGlobalScale(scale: ReadonlyObservableValue<number>) {
		AutoUIScaledControl.initializeGlobalScale(scale);
	}

	readonly instance: T;

	constructor(gui: T) {
		super(gui);
		this.instance = gui;
	}
}
