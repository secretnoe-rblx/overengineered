import type { BlockConfigType } from "shared/blockLogic/BlockLogic";

type Keys = BlockConfigTypes2.TypeKeys;
type Types = BlockConfigTypes2.Types;

export type BlockConfigPart<TKey extends Keys> = {
	readonly type: TKey;
	readonly config: Types[TKey]["config"] | undefined;
};
export type DefinedBlockConfigPart<TKey extends Keys> = {
	readonly type: TKey;
	readonly config: Types[TKey]["config"];
};

type GenericConfig = BlockConfigPart<Keys>;
type GenericDefinedConfig = DefinedBlockConfigPart<Keys>;

type LessGenericConfig = { [k in Keys]: BlockConfigPart<k> }[Keys];
type LessGenericDefinedConfig = { [k in Keys]: DefinedBlockConfigPart<k> }[Keys];

export type PlacedBlockConfig2 = {
	readonly [k in string]?: LessGenericConfig;
};
export type DefinedPlacedBlockConfig2 = {
	readonly [k in string]: LessGenericDefinedConfig;
};

export namespace BlockConfig {
	type Def = {
		readonly [k in string]: BlockConfigType;
	};

	export function addDefaults<TDef extends Def>(
		config: PlacedBlockConfig2 | undefined,
		definition: TDef,
	): DefinedPlacedBlockConfig2 {
		const result: { [k in string]?: GenericConfig } = { ...(config ?? {}) };

		for (const [k, def] of pairs(definition)) {
			assert(typeIs(k, "string"));

			const obj = result[k];
			if (obj?.type === "unset" || obj?.type === "wire") {
				continue;
			}

			if (!obj) {
				const cfg: GenericDefinedConfig = {
					type: def.defaultType,
					config: def.types[def.defaultType]!.config,
				};
				result[k] = cfg;

				continue;
			}

			const defConfig = def.types[obj.type]!.config;

			if (typeIs(defConfig, "table")) {
				if (obj.config !== undefined && !typeIs(obj.config, "table")) {
					throw "wrong stuff bruh";
				}

				const cfg: GenericDefinedConfig = {
					...obj,
					config: {
						...(obj.config ?? {}),
						...defConfig,
					},
				};
				result[k] = cfg;

				continue;
			}

			const cfg: GenericDefinedConfig = {
				...obj,
				config: defConfig,
			};
			result[k] = cfg;
		}

		return result as DefinedPlacedBlockConfig2;
	}
}
