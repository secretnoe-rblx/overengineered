import { Objects } from "shared/fixes/objects";
import type { BlockConfigType } from "shared/blockLogic/BlockLogic";

type Keys = BlockConfigTypes2.TypeKeys;
type Types = BlockConfigTypes2.Types;

export type BlockConfigPart<TKey extends Keys> = {
	readonly type: TKey;
	readonly config: Types[TKey]["config"];
};

type GenericConfig = BlockConfigPart<Keys>;
export type PlacedBlockConfig = {
	readonly [k in string]: { [k in Keys]: BlockConfigPart<k> }[Keys];
};

export namespace BlockConfig {
	type Def = {
		readonly [k in string]: BlockConfigType;
	};

	export function addDefaults<TDef extends Def>(
		config: PlacedBlockConfig | undefined,
		definition: TDef,
	): PlacedBlockConfig {
		const result: { [k in string]?: GenericConfig } = { ...(config ?? {}) };

		for (const [k, def] of pairs(definition)) {
			assert(typeIs(k, "string"));

			const obj = result[k];
			if (obj?.type === "unset" || obj?.type === "wire") {
				continue;
			}

			if (!obj) {
				const defaultType = Objects.firstKey(def.types) ?? "unset";

				const cfg: GenericConfig = {
					type: defaultType,
					config: defaultType === "unset" ? (undefined as never) : def.types[defaultType]!.config,
				};
				result[k] = cfg;

				continue;
			}

			const defConfig = def.types[obj.type]!.config;

			if (typeIs(defConfig, "table")) {
				if (obj.config !== undefined && !typeIs(obj.config, "table")) {
					throw "wrong stuff bruh";
				}

				const cfg: GenericConfig = {
					...obj,
					config: {
						...(obj.config ?? {}),
						...defConfig,
					},
				};
				result[k] = cfg;

				continue;
			}

			const cfg: GenericConfig = {
				...obj,
				config: defConfig,
			};
			result[k] = cfg;
		}

		return result as PlacedBlockConfig;
	}
}
