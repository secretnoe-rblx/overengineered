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

	type NumberControlDefaults = {
		readonly min: number;
		readonly max: number;
		readonly step?: number;
	};
	/** Hold `add` to smoothly increase the value. Hold `sub` to smoothly decrease value. */
	export type SmoothNumberControl = NumberControlDefaults & {
		readonly canBeSwitch: boolean;

		readonly config: {
			readonly type: "smooth";

			/** Default value on start */
			readonly startValue: number;
			/** Speed of changing the value, 1s per second */
			readonly speed: number;
			/** Key to increase the value */
			readonly add: string | KeyCode;
			/** Key to decrease the value */
			readonly sub: string | KeyCode;

			readonly switchmode: boolean;
		};
	};
	/** Hold `control` to instantly set the value to max. */
	export type HoldNumberControl = NumberControlDefaults & {
		readonly config: {
			readonly type: "hold";

			/** Value that is set when the key is not being held */
			readonly releasedValue: number;
			/** Value that is set when the key is being held */
			readonly holdingValue: number;
			/** Key to change the value */
			readonly key: string | KeyCode;
		};
	};
	/** Hold `add` to instantly set the value to max. Hold `sub` to instantly set the value to min. */
	export type DoubleHoldNumberControl = NumberControlDefaults & {
		readonly canBeSwitch: boolean;

		readonly config: {
			readonly type: "doublehold";

			/** Value that is set when no key is being held */
			readonly releasedValue: number;
			/** Value that is set when a key is being held */
			readonly holdingValue: number;
			/** Key to set the value to max */
			readonly add: string | KeyCode;
			/** Key to set the value to min */
			readonly sub: string | KeyCode;

			readonly switchmode: boolean;
		};
	};
	export type NumberControls = SmoothNumberControl | HoldNumberControl | DoubleHoldNumberControl;
	export type Number = BCPrimitive<number> & {
		readonly control?: NumberControls & { readonly defaultType: NumberControls["config"]["type"] };
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
