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

	export type Bool = BCPrimitive<boolean> & {
		readonly control?: KeyBool;
	};
	export type Number = BCPrimitive<number> & {
		readonly clamp?: {
			readonly showAsSlider: boolean;
			readonly min: number;
			readonly max: number;
			readonly step: number;
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

	export type KeyBool = BCType<
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
	export type Controls = {
		readonly keybool: KeyBool & {
			readonly primitive: "bool";
		};
	};
}
