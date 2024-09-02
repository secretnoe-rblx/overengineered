import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";

export namespace BlockLogicTypes {
	type BCType<TDefault, TConfig> = {
		readonly config: TConfig;

		/** @deprecated Used only to indicate the type for the type system */
		readonly default: TDefault;
	};
	type BCPrimitive<TDefault> = BCType<TDefault, TDefault>;

	export type UnsetValue = { readonly ___nominal: "Unset" };
	export type Unset = BCPrimitive<UnsetValue>;

	export type WireValue = {
		/** OUTPUT block uiid */
		readonly blockUuid: BlockUuid;

		/** OUTPUT connector name */
		readonly connectionName: BlockConnectionName;

		readonly prevConfig: PlacedBlockConfig[string] | undefined;
	};
	export type Wire = BCPrimitive<WireValue>;

	export type BoolControls = {
		readonly config: {
			readonly enabled: boolean;
			readonly key: string;
			readonly switch: boolean;
			readonly reversed: boolean;
		};
		readonly canBeSwitch: boolean;
		readonly canBeReversed: boolean;
	};
	export type Bool = BCPrimitive<boolean> & {
		readonly control?: BoolControls;
	};

	export type NumberControlsSimplified = {
		readonly motorRotationSpeed: {
			readonly type: "motorRotationSpeed";
			readonly config: {
				readonly rotation: {
					readonly add: KeyCode;
					readonly sub: KeyCode;
				};
				readonly speed: number;
				readonly switchmode: boolean;
			};
			readonly maxSpeed: number;
		};
		readonly servoMotorAngle: {
			readonly type: "servoMotorAngle";
			readonly config: {
				readonly rotation: {
					readonly add: KeyCode;
					readonly sub: KeyCode;
				};
				readonly switchmode: boolean;
				readonly angle: number;
			};
			readonly minAngle: number;
			readonly maxAngle: number;
		};
		readonly thrust: {
			readonly type: "thrust";
			readonly config: {
				readonly thrust: {
					readonly add: KeyCode;
					readonly sub: KeyCode;
				};
				readonly switchmode: boolean;
			};
			readonly canBeSwitch: boolean;
		};
		readonly controllableNumber: {
			readonly type: "controllableNumber";
			readonly config: {
				readonly value: number;
				readonly control: {
					readonly add: KeyCode;
					readonly sub: KeyCode;
				};
			};
			readonly min: number;
			readonly max: number;
			readonly step: number;
		};
	};

	type NumberControlModeSmooth = {
		readonly type: "smooth";
		readonly speed: number;
	};
	type NumberControlModeHold = {
		readonly type: "hold";
	};
	type NumberControlModeSwitch = {
		readonly type: "switch";
	};
	export type NumberControlModes = NumberControlModeSmooth | NumberControlModeHold | NumberControlModeSwitch;

	export type NumberControlKey = {
		readonly key: string | KeyCode;
		readonly value: number;
	};

	export type NumberControlKeys = readonly NumberControlKey[];
	export type NumberControl = {
		/** Global minimum for the resulting value & the configuration UI */
		readonly min: number;
		/** Global maximum for the resulting value & the configuration UI */
		readonly max: number;
		/** Global step for the resulting value & the configuration UI */
		readonly step?: number;
		/** If defined, enables the `extended` checkbox and decides which gui is shown when pressed */
		readonly simplified?: keyof NumberControlsSimplified;

		readonly config: {
			readonly enabled: boolean;
			readonly extended: boolean;
			readonly keys: NumberControlKeys;
			readonly mode: NumberControlModes;
		};
	};
	export type Number = BCPrimitive<number> & {
		readonly control?: NumberControl;
		readonly clamp?: {
			readonly showAsSlider: boolean;
			readonly min: number;
			readonly max: number;
			readonly step?: number;
		};
	};
	export type String = BCPrimitive<string>;
	export type Key = BCPrimitive<string>;
	export type Vec3 = BCPrimitive<Vector3>;
	export type Color = BCPrimitive<Color3>;
	export type Byte = BCPrimitive<number>;
	export type ByteArray = BCPrimitive<readonly number[]> & {
		readonly lengthLimit: number;
	};

	//

	export type Primitives = {
		readonly unset: Unset;
		readonly wire: Wire;

		readonly bool: Bool;
		readonly number: Number;
		readonly string: String;
		readonly key: Key;
		readonly vector3: Vec3;
		readonly color: Color;
		readonly byte: Byte;
		readonly bytearray: ByteArray;
	};

	export type Controls = {
		readonly [k in ExtractKeys<Primitives, { readonly control?: unknown }>]: Primitives[k]["control"] & defined;
	};
}
