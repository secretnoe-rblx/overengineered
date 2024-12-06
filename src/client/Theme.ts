import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Objects } from "engine/shared/fixes/Objects";

const defaultColors = {
	accent: Color3.fromRGB(18, 68, 144),

	buttonNormal: Color3.fromRGB(1, 4, 9),
	buttonActive: Color3.fromRGB(16, 68, 145), // should be the same as accent probably?
	buttonNegative: Color3.fromRGB(103, 34, 34),
	buttonPositive: Color3.fromRGB(27, 106, 22),
} as const;
export type ThemeKeys = keyof typeof defaultColors;

export class Theme {
	private readonly colors: { readonly [k in ThemeKeys]: ObservableValue<Color3> };

	constructor() {
		this.colors = Objects.mapValues(defaultColors, (k, v) => new ObservableValue(v));
	}

	getColor(key: ThemeKeys): Color3 {
		return this.colors[key].get();
	}
	getObservable(key: ThemeKeys): ObservableValue<Color3> {
		return this.colors[key];
	}
}
