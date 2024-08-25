import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";

export namespace BlockLogicTypes {
	type BCType<TType extends string, TDefault, TConfig> = {
		readonly type: TType;
		readonly default: TDefault;
		readonly config: TConfig;
	};
	type BCPrimitive<TType extends string, TDefault> = BCType<TType, TDefault, TDefault>;

	export type UnsetValue = { readonly ___nominal: "Unset" };
	export type Unset = BCPrimitive<"unset", UnsetValue>;

	export type WireValue = {
		/** OUTPUT block uiid */
		readonly blockUuid: BlockUuid;

		/** OUTPUT connector name */
		readonly connectionName: BlockConnectionName;

		readonly prevConfig: PlacedBlockConfig[string] | undefined;
	};
	export type Wire = BCPrimitive<"wire", WireValue>;

	export type Bool = BCPrimitive<"bool", boolean>;
	export type Number = BCPrimitive<"number", number> & {
		readonly clamp?: {
			readonly showAsSlider: boolean;
			readonly min: number;
			readonly max: number;
			readonly step: number;
		};
	};
	export type String = BCPrimitive<"string", string>;
	export type Key = BCPrimitive<"key", string>;
	export type Vec3 = BCPrimitive<"vector3", Vector3>;
	export type Color = BCPrimitive<"color", Color3>;
	export type Byte = BCPrimitive<"byte", number>;
	export type ByteArray = BCPrimitive<"bytearray", readonly number[]> & {
		readonly lengthLimit: number;
	};

	export type KeyBool = BCType<
		"keybool",
		boolean,
		{
			readonly key: string;
			readonly switch: boolean;
			readonly reversed: boolean;
		}
	> & {
		readonly canBeSwitch: boolean;
		readonly canBeReversed: boolean;
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
	export type NonPrimitives = {
		readonly keybool: KeyBool;
	};
	export type Controls = {
		readonly bool: {
			readonly keybool: KeyBool;
		};
	};

	export type Types = Primitives & NonPrimitives;
	export type TypeKeys = keyof Types;
}
