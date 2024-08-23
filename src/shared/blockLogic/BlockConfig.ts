import { Objects } from "shared/fixes/objects";
import type { BlockLogicFullInputDef } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

type Primitives = BlockLogicTypes.Primitives;
type PrimitiveKeys = keyof Primitives;

type AllTypes = BlockLogicTypes.Types;
type AllKeys = keyof AllTypes;

export type BlockConfigTypesByPrimitive<TKeys extends PrimitiveKeys> = {
	readonly [k in PrimitiveKeys]: Extract<AllTypes[AllKeys], { readonly default: AllTypes[k]["default"] }>["type"];
}[TKeys];
export type BlockConfigPrimitiveByType<TKeys extends AllKeys> = {
	readonly [k in AllKeys]: Extract<AllTypes[PrimitiveKeys], { readonly default: AllTypes[k]["default"] }>["type"];
}[TKeys];

export type BlockConfigPart<TKey extends PrimitiveKeys> = {
	readonly type: TKey;
	readonly config: AllTypes[BlockConfigTypesByPrimitive<TKey>]["config"];
};

type GenericConfig = BlockConfigPart<PrimitiveKeys>;
export type PlacedBlockConfig = {
	readonly [k in string]: { [k in PrimitiveKeys]: BlockConfigPart<k> }[PrimitiveKeys];
};

export namespace BlockConfig {
	type Def = {
		readonly [k in string]: BlockLogicFullInputDef;
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
				// without a connector we can only configure the value with the config tool; thus, "unset" makes zero sense
				const defaultType = def.connectorHidden ? Objects.firstKey(def.types) ?? "unset" : "unset";

				const cfg: GenericConfig = {
					type: defaultType,
					config: defaultType === "unset" ? (undefined as never) : def.types[defaultType]!.config,
				};
				result[k] = cfg;

				continue;
			}

			if (obj.type && obj.config !== undefined) {
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
