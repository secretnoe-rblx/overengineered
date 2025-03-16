import { Players } from "@rbxts/services";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Objects } from "engine/shared/fixes/Objects";

const defaultColors = {
	accent: Color3.fromRGB(18, 68, 144),

	buttonNormal: Color3.fromRGB(1, 4, 9),
	backgroundSecondary: Color3.fromRGB(13, 17, 23),
	backgroundSecondaryLight: Color3.fromRGB(33, 43, 58),
	buttonActive: Color3.fromRGB(16, 68, 145), // should be the same as accent probably?
	buttonNegative: Color3.fromRGB(103, 34, 34),
	buttonPositive: Color3.fromRGB(27, 106, 22),
	buttonClose: Color3.fromRGB(255, 84, 84),
};
if (Players.LocalPlayer.Name === "i3ymm") {
	(defaultColors as Writable<typeof defaultColors>).accent = Color3.fromHex("7d80da");
	(defaultColors as Writable<typeof defaultColors>).buttonActive = Color3.fromHex("7d80da");
}

export type ThemeColorKey = keyof typeof defaultColors;

const defaultStrings = {
	//
};

const defaultValues = {
	...defaultColors,
	...defaultStrings,
};
export type ThemeValues = typeof defaultValues;
export type ThemeKey = keyof ThemeValues;

export class Theme {
	private readonly values: {
		readonly [k in ThemeKey]: ObservableValue<ThemeValues[k]>;
	};

	constructor() {
		this.values = Objects.mapValues(defaultValues, (k, v) => new ObservableValue(v)) as typeof this.values;
	}

	get<K extends ThemeKey>(key: K): ObservableValue<ThemeValues[K]> {
		return this.values[key];
	}
}
