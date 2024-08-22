import { MultiBlockConfigControl } from "client/gui/BlockConfigControls";
import { Control } from "client/gui/Control";
import { Element } from "shared/Element";
import type { VisualBlockConfigDefinitions } from "client/gui/BlockConfigControls";
import type { BlockConfigPart } from "shared/blockLogic/BlockConfig";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

export const _Tests = () => {
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
				bool: { type: "bool", config: false },
				number: { type: "number", config: 0 },
				// string: {},
			},
		},
		multiTypeMixed: {
			displayName: "Multi Type Mixed",
			types: {
				bool: { type: "bool", config: false },
				number: { type: "number", config: 0 },
				// string: {},
			},
		},
		multiValueMixed: {
			displayName: "Multi Value Mixed",
			types: {
				bool: { type: "bool", config: false },
				number: { type: "number", config: 0 },
				// string: {},
			},
		},
		boolTrue: {
			displayName: "Bool True",
			types: { bool: { type: "bool", config: false } },
		},
		boolFalse: {
			displayName: "Bool False",
			types: { bool: { type: "bool", config: false } },
		},
		boolMixed: {
			displayName: "Bool Mixed",
			types: { bool: { type: "bool", config: false } },
		},
		number: {
			displayName: "Number",
			types: { number: { type: "number", config: 0 } },
		},
		numberMixed: {
			displayName: "Number Mixed",
			types: { number: { type: "number", config: 0 } },
		},
		// string: {
		// 	displayName: "String",
		// 	types: { string: {} },
		// },
		// stringMixed: {
		// 	displayName: "String Mixed",
		// 	types: { string: {} },
		// },
		clampedNumber: {
			displayName: "Slider",
			types: { number: { type: "clampedNumber", config: 0, min: 0, max: 63, step: 1 } },
		},
		clampedNumberMixed: {
			displayName: "Slider Mixed",
			types: { number: { type: "clampedNumber", config: 0, min: 0, max: 63, step: 1 } },
		},
		// byte: {
		// 	displayName: "Byte",
		// 	types: { byte: {} },
		// },
		// byteMixed: {
		// 	displayName: "Byte Mixed",
		// 	types: { byte: {} },
		// },
		key: {
			displayName: "Key",
			types: { key: { type: "key", config: "F" } },
		},
		keyMixed: {
			displayName: "Key Mixed",
			types: { key: { type: "key", config: "F" } },
		},
		keyBool: {
			displayName: "Keybool",
			types: {
				bool: {
					type: "keybool",
					config: { key: "F", reversed: false, switch: false },
					canBeReversed: true,
					canBeSwitch: true,
				},
			},
		},
		// motorRotationSpeed: {
		// 	displayName: "Motor",
		// 	types: { motorRotationSpeed: { maxSpeed: 100 } },
		// },
		// servoMotorAngle: {
		// 	displayName: "Servo",
		// 	types: { servoMotorAngle: { minAngle: 0, maxAngle: 90 } },
		// },
		// thrust: {
		// 	displayName: "Thrust",
		// 	types: { thrust: { canBeSwitch: true } },
		// },
		// controllableNumber: {
		// 	displayName: "Controllable Number",
		// 	types: { controllableNumber: { min: 0, max: 100, step: 0.01 } },
		// },
		// vector3: {
		// 	displayName: "Vector3",
		// 	types: { vector3: {} },
		// },
		// vector3Mixed: {
		// 	displayName: "Vector3 Mixed",
		// 	types: { vector3: {} },
		// },
		// color: {
		// 	displayName: "Color",
		// 	types: { color: {} },
		// },
		// colorMixed: {
		// 	displayName: "Color Mixed",
		// 	types: { color: {} },
		// },
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
		// string: { type: "string", config: "asd" },
		// stringMixed: { type: "string", config: "asd" },
		clampedNumber: { type: "number", config: 46 },
		clampedNumberMixed: { type: "number", config: 0 },
		// byte: { type: "byte", config: 7 },
		// byteMixed: { type: "byte", config: 7 },
		key: { type: "key", config: "F" },
		keyMixed: { type: "key", config: "F" },
		keyBool: { type: "bool", config: { key: "F", reversed: false, switch: false } },
		// motorRotationSpeed: {
		// 	type: "motorRotationSpeed",
		// 	config: { rotation: { add: "R", sub: "F" }, speed: 49, switchmode: true },
		// },
		// servoMotorAngle: {
		// 	type: "servoMotorAngle",
		// 	config: { rotation: { add: "R", sub: "F" }, angle: 46, switchmode: true },
		// },
		// thrust: {
		// 	type: "thrust",
		// 	config: { thrust: { add: "R", sub: "F" }, switchmode: true },
		// },
		// controllableNumber: {
		// 	type: "controllableNumber",
		// 	config: { control: { add: "R", sub: "F" }, value: 4 },
		// },
		// vector3: { type: "vector3", config: new Vector3(1, 2, 3) },
		// vector3Mixed: { type: "vector3", config: new Vector3(1, 2, 3) },
		// color: { type: "color", config: new Color3(1, 0, 1) },
		// colorMixed: { type: "color", config: new Color3(1, 0, 1) },
	};
	const b2: cfg[string] = {
		...b1,
		multiTypeMixed: { type: "number", config: 727 },
		multiValueMixed: { type: "bool", config: false },
		boolMixed: { type: "bool", config: false },
		numberMixed: { type: "number", config: 63 },
		// stringMixed: { type: "string", config: "asdfgh" },
		clampedNumberMixed: { type: "number", config: 5 },
		// byteMixed: { type: "byte", config: 9 },
		keyMixed: { type: "key", config: "R" },
		keyBool: { type: "bool", config: { key: "F", reversed: false, switch: false } },
		// vector3Mixed: { type: "vector3", config: new Vector3(4, 2, 3) },
		// colorMixed: { type: "color", config: new Color3(1, 0, 0) },
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

		const mcc = new MultiBlockConfigControl(
			frame,
			def,
			{ b1, b2 } as { readonly [k in BlockUuid]: cfg[k] },
			undefined,
		);
		mcc.submitted.Connect(print);
		list.add(mcc);
	}

	return control;
};
