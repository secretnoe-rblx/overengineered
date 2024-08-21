import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";

export namespace BlockLogicTypes3 {
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
	export type Number = BCPrimitive<"number", number>;
	export type Key = BCPrimitive<"key", string>;

	export type ClampedNumber = BCPrimitive<"clampedNumber", number> & {
		readonly min: number;
		readonly max: number;
		readonly step: number;
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
		readonly key: Key;
	};
	export type NonPrimitives = {
		readonly clampedNumber: ClampedNumber;
		readonly keybool: KeyBool;
	};

	export type Types = Primitives & NonPrimitives;
	export type TypeKeys = keyof Types;
}
