import { AutoUIScaledControl } from "client/gui/AutoUIScaledControl";

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
