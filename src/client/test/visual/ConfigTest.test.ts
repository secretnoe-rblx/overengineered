import { MultiBlockConfigControl } from "client/gui/BlockConfigControls";
import { Control } from "client/gui/Control";
import { Element } from "shared/Element";
import type { VisualBlockConfigDefinitions } from "client/gui/BlockConfigControls";
import type { BlockConfigPart } from "shared/blockLogic/BlockConfig";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { UnitTests } from "shared/test/TestFramework";

namespace ConfigTests {
	export function show(di: DIContainer) {
		const frame = Element.create(
			"Frame",
			{
				Position: new UDim2(0.3, 0, 0.033, 0),
				Size: new UDim2(0, 324, 0, 1107),
				BackgroundColor3: Color3.fromRGB(1, 4, 9),
				BackgroundTransparency: 0.5,
			},
			{
				padding: Element.create("UIPadding", {
					PaddingBottom: new UDim(0, 5),
					PaddingLeft: new UDim(0, 5),
					PaddingRight: new UDim(0, 2),
					PaddingTop: new UDim(0, 5),
				}),
			},
		);

		const control = new Control(frame);

		const def = {
			multi: {
				displayName: "Multi",
				types: {
					bool: { config: false },
					number: { config: 0 },
					// string: {},
				},
			},
			multiTypeMixed: {
				displayName: "Multi Type Mixed",
				types: {
					bool: { config: false },
					number: { config: 0 },
					// string: {},
				},
			},
			multiValueMixed: {
				displayName: "Multi Value Mixed",
				types: {
					bool: { config: false },
					number: { config: 0 },
					// string: {},
				},
			},
			boolTrue: {
				displayName: "Bool True",
				types: { bool: { config: false } },
			},
			boolFalse: {
				displayName: "Bool False",
				types: { bool: { config: false } },
			},
			boolMixed: {
				displayName: "Bool Mixed",
				types: { bool: { config: false } },
			},
			number: {
				displayName: "Number",
				types: { number: { config: 0 } },
			},
			numberMixed: {
				displayName: "Number Mixed",
				types: { number: { config: 0 } },
			},
			string: {
				displayName: "String",
				types: { string: { config: "" } },
			},
			stringMixed: {
				displayName: "String Mixed",
				types: { string: { config: "" } },
			},
			clampedNumber: {
				displayName: "Slider",
				types: { number: { config: 0, clamp: { showAsSlider: true, min: 0, max: 63, step: 1 } } },
			},
			clampedNumberMixed: {
				displayName: "Slider Mixed",
				types: { number: { config: 0, clamp: { showAsSlider: true, min: 0, max: 63, step: 1 } } },
			},
			byte: {
				displayName: "Byte",
				types: { byte: { config: 0 } },
			},
			byteMixed: {
				displayName: "Byte Mixed",
				types: { byte: { config: 0 } },
			},
			key: {
				displayName: "Key",
				types: { key: { config: "F" } },
			},
			keyMixed: {
				displayName: "Key Mixed",
				types: { key: { config: "F" } },
			},
			keyBool: {
				displayName: "Keybool",
				types: {
					bool: {
						config: false,
						control: {
							config: { enabled: true, key: "F", reversed: false, switch: false },
							canBeReversed: true,
							canBeSwitch: true,
						},
					},
				},
			},
			keyBoolMixed: {
				displayName: "Keybool Mixed",
				types: {
					bool: {
						config: false,
						control: {
							config: { enabled: true, key: "F", reversed: false, switch: false },
							canBeReversed: true,
							canBeSwitch: true,
						},
					},
				},
			},
			keyBoolMixedEnabled: {
				displayName: "Keybool Mixed Enable",
				types: {
					bool: {
						config: false,
						control: {
							config: { enabled: true, key: "F", reversed: false, switch: false },
							canBeReversed: true,
							canBeSwitch: true,
						},
					},
				},
			},
			numberControlled: {
				displayName: "Motor",
				types: {
					number: {
						config: 0,
						clamp: {
							showAsSlider: false,
							min: 0,
							max: 100,
						},
						control: {
							config: {
								startValue: 0,
								mode: {
									stopOnRelease: true,
									resetOnRelease: false,
									smooth: false,
									smoothSpeed: 25,
								},
								enabled: true,
								keys: [
									{ key: "R", value: 100 },
									{ key: "F", value: 0 },
								],
							},
						},
					},
				},
			},
			vector3: {
				displayName: "Vector3",
				types: { vector3: { config: new Vector3() } },
			},
			vector3Mixed: {
				displayName: "Vector3 Mixed",
				types: { vector3: { config: new Vector3() } },
			},
			color: {
				displayName: "Color",
				types: { color: { config: new Color3() } },
			},
			colorMixed: {
				displayName: "Color Mixed",
				types: { color: { config: new Color3() } },
			},
		} as const satisfies VisualBlockConfigDefinitions;

		type cfg = {
			readonly [k in string]: {
				readonly [k in keyof typeof def]: BlockConfigPart<keyof BlockLogicTypes.Primitives>;
			};
		};

		const b1: cfg[string] = {
			multi: { type: "bool", config: true },
			multiTypeMixed: { type: "bool", config: 727 },
			multiValueMixed: { type: "bool", config: true },
			boolTrue: { type: "bool", config: true },
			boolFalse: { type: "bool", config: false },
			boolMixed: { type: "bool", config: true },
			number: { type: "number", config: 727 },
			numberMixed: { type: "number", config: 727 },
			string: { type: "string", config: "asd" },
			stringMixed: { type: "string", config: "asd" },
			clampedNumber: { type: "number", config: 46 },
			clampedNumberMixed: { type: "number", config: 0 },
			byte: { type: "byte", config: 7 },
			byteMixed: { type: "byte", config: 7 },
			key: { type: "key", config: "F" },
			keyMixed: { type: "key", config: "F" },
			keyBool: {
				type: "bool",
				config: false,
				controlConfig: { enabled: true, key: "F", reversed: false, switch: false },
			},
			keyBoolMixed: {
				type: "bool",
				config: false,
				controlConfig: { enabled: true, key: "F", reversed: false, switch: false },
			},
			keyBoolMixedEnabled: {
				type: "bool",
				config: false,
				controlConfig: { enabled: true, key: "F", reversed: false, switch: false },
			},
			numberControlled: {
				type: "number",
				config: 0,
				controlConfig: {
					enabled: true,
					startValue: 0,
					mode: {
						stopOnRelease: false,
						resetOnRelease: false,
						smooth: false,
						smoothSpeed: 25,
					},
					keys: [
						{ key: "R", value: 100 },
						{ key: "F", value: 0 },
					],
				},
			},
			vector3: { type: "vector3", config: new Vector3(1, 2, 3) },
			vector3Mixed: { type: "vector3", config: new Vector3(1, 2, 3) },
			color: { type: "color", config: new Color3(1, 0, 1) },
			colorMixed: { type: "color", config: new Color3(1, 0, 1) },
		};
		const b2: cfg[string] = {
			...b1,
			multiTypeMixed: { type: "number", config: 727 },
			multiValueMixed: { type: "bool", config: false },
			boolMixed: { type: "bool", config: false },
			numberMixed: { type: "number", config: 63 },
			stringMixed: { type: "string", config: "asdfgh" },
			clampedNumberMixed: { type: "number", config: 5 },
			byteMixed: { type: "byte", config: 9 },
			keyMixed: { type: "key", config: "R" },
			keyBoolMixed: {
				type: "bool",
				config: false,
				controlConfig: { enabled: true, key: "R", reversed: true, switch: true },
			},
			keyBoolMixedEnabled: {
				type: "bool",
				config: false,
				controlConfig: { enabled: false, key: "F", reversed: false, switch: false },
			},
			vector3Mixed: { type: "vector3", config: new Vector3(4, 2, 3) },
			colorMixed: { type: "color", config: new Color3(1, 0, 0) },
		};

		// multiconfig
		{
			const frame = Element.create(
				"ScrollingFrame",
				{
					Position: new UDim2(),
					Size: new UDim2(1, 0, 1, 0),
					BackgroundTransparency: 1,
					AutomaticCanvasSize: Enum.AutomaticSize.Y,
					ScrollBarThickness: 8,
				},
				{
					list: Element.create("UIListLayout", { Padding: new UDim(0, 5) }),
					padding: Element.create("UIPadding", { PaddingRight: new UDim(0, 9) }),
				},
			);

			const list = control.add(new Control(frame));

			const mcc = di.resolveForeignClass(MultiBlockConfigControl, [
				frame,
				def,
				{ b1, b2 } as { readonly [k in BlockUuid]: cfg[k] },
				undefined,
				new Map(),
			]);
			mcc.submitted.Connect(print);
			list.add(mcc);
		}

		return control;
	}
}
export const _Tests: UnitTests = { ConfigTests };
