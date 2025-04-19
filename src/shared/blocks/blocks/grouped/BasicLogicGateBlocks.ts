import { t } from "engine/shared/t";
import { BlockLogic, CalculatableBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockLogicValueResults } from "shared/blockLogic/BlockLogicValueStorage";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type {
	AllInputKeysToObject,
	AllOutputKeysToObject,
	BlockLogicArgs,
	BlockLogicFullBothDefinitions,
	BlockLogicTickContext,
} from "shared/blockLogic/BlockLogic";
import type { BlockBuilder, BlockCategoryPath, BlockModelSource } from "shared/blocks/Block";

const autoModel = (prefab: BlockCreation.Model.PrefabName, text: string, category: BlockCategoryPath) => {
	return {
		model: BlockCreation.Model.fAutoCreated(prefab, text),
		category: () => category,
	} satisfies BlockModelSource;
};
const defs = {
	bool1_bool: {
		input: {
			value: {
				displayName: "Value",
				types: BlockConfigDefinitions.bool,
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
	bool2_bool: {
		inputOrder: ["value1", "value2"],
		input: {
			value1: {
				displayName: "Value 1",
				types: BlockConfigDefinitions.bool,
			},
			value2: {
				displayName: "Value 2",
				types: BlockConfigDefinitions.bool,
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: ["bool"],
			},
		},
	},
} as const satisfies { readonly [k in string]: BlockLogicFullBothDefinitions };

namespace And {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === false || value2 === false) {
						return this.output.result.set("bool", false);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", value1 && value2);
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "and",
		displayName: "AND Gate",
		description: "Returns true when both inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "AND", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Or {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === true || value2 === true) {
						return this.output.result.set("bool", true);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", value1 || value2);
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "or",
		displayName: "OR Gate",
		description: "Returns true when either input is true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "OR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Nand {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === false || value2 === false) {
						return this.output.result.set("bool", true);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", !(value1 && value2));
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "nand",
		displayName: "NAND Gate",
		description: "Returns true when both inputs are false",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NAND", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Nor {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeRecalcInputCache("value1");
			const value2cache = this.initializeRecalcInputCache("value2");

			this.onkRecalcInputs(
				[],
				() => {
					const value1 = value1cache.tryGet();
					const value2 = value2cache.tryGet();

					if (value1 === true || value2 === true) {
						return this.output.result.set("bool", false);
					}

					if (value1 === undefined || value2 === undefined) {
						return this.output.result.unset();
					}

					this.output.result.set("bool", !(value1 || value2));
				},
				(result) => {
					if (result !== BlockLogicValueResults.availableLater) return;
					this.output.result.unset();
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "nor",
		displayName: "NOR Gate",
		description: "Returns true when none of the inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NOR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Xor {
	const definition = defs.bool2_bool;

	class Logic extends CalculatableBlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);
		}

		protected override calculate(
			{ value1, value2 }: AllInputKeysToObject<(typeof definition)["input"]>,
			ctx: BlockLogicTickContext,
		): AllOutputKeysToObject<(typeof definition)["output"]> | BlockLogicValueResults {
			return { result: { type: "bool", value: value1 !== value2 } };
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "xor",
		displayName: "XOR Gate",
		description: "Returns true when only one of the inputs is true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "XOR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Xnor {
	const definition = defs.bool2_bool;

	class Logic extends CalculatableBlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);
		}

		protected override calculate(
			{ value1, value2 }: AllInputKeysToObject<(typeof definition)["input"]>,
			ctx: BlockLogicTickContext,
		): AllOutputKeysToObject<(typeof definition)["output"]> | BlockLogicValueResults {
			return { result: { type: "bool", value: !(value1 !== value2) } };
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "xnor",
		displayName: "XNOR Gate",
		description: "Returns true when both of the inputs are the same",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "XNOR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Not {
	const definition = defs.bool1_bool;

	class Logic extends CalculatableBlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);
		}

		protected override calculate(
			{ value }: AllInputKeysToObject<(typeof definition)["input"]>,
			ctx: BlockLogicTickContext,
		): AllOutputKeysToObject<(typeof definition)["output"]> | BlockLogicValueResults {
			return { result: { type: "bool", value: !value } };
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "not",
		displayName: "NOT Gate",
		description: "Returns true when input is false, and vice versa",
		modelSource: autoModel("GenericLogicBlockPrefab", "NOT", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}
namespace Mux {
	const definition = {
		inputOrder: ["value", "truevalue", "falsevalue"],
		input: {
			value: {
				displayName: "State/Index",
				types: {
					number: {
						config: 0,
					},
					byte: {
						config: 0,
					},
					bool: {
						config: false,
					},
				},
			},
			truevalue: {
				displayName: "Value 1",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			falsevalue: {
				displayName: "Value 2",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
		},
		output: {
			result: {
				displayName: "Result",
				types: asMap(BlockConfigDefinitions.any).keys(),
				group: "1",
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	const activeInColor = Color3.fromRGB(0, 255, 255);
	const activeOutColor = Color3.fromRGB(0, 255, 0);
	const baseColor = Color3.fromRGB(59, 59, 59);
	const neonMaterial = Enum.Material.Neon;
	const baseMaterial = Enum.Material.Glass;

	const update = ({ lamps, index, color }: UpdateData) => {
		if (!lamps) return;

		const parts = [lamps];
		for (let i = 0; i < parts.size(); i++) {
			const part = parts[i];
			if (i === index) {
				part.Color = color;
				part.Material = neonMaterial;
				continue;
			}

			part.Color = baseColor;
			part.Material = baseMaterial;
		}
	};

	const updateEventType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<BlockModel>(),
		lamps: t.instance("BasePart"),
		index: t.number,
		color: t.color,
	});
	type UpdateData = t.Infer<typeof updateEventType>;

	const events = {
		update: new BlockSynchronizer("b_lamp_update", updateEventType, update),
	} as const;

	type muxLamp = BasePart & {
		lamp: BasePart;
	};

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const nodes = [this.input.falsevalue, this.input.truevalue];
			const allMuxLampInstances = this.instance?.FindFirstChild("Leds") as
				| (Folder & Record<`${number}`, muxLamp>)
				| undefined;
			if (!allMuxLampInstances) throw "Vas?";

			const muxLamps: BasePart[] = [];
			allMuxLampInstances.GetChildren().forEach((v) => {
				const i = tonumber(v.Name)!;
				const base = muxLamps[i] as muxLamp;
				muxLamps[i] = base.lamp;
			});

			const muxValue = (
				index: number,
				values: unknown[],
				outputType: "string" | "number" | "bool" | "vector3" | "color" | "byte",
			) => {
				const len = nodes.size();
				if (len === 0) return;
				index = math.clamp(index, 0, nodes.size() - 1);

				//set value
				this.output.result.set(outputType, values[index] as typeof outputType);

				//set color
				if (muxLamps.isEmpty()) return;
				events.update.send({
					block: this.instance!,
					lamps: muxLamps[0],
					index,
					color: activeInColor,
				});
			};

			this.onk(
				["value", "falsevalue", "truevalue"],
				({ value, valueType, falsevalue, truevalue, truevalueType }) => {
					if (valueType === "bool") value = value ? 1 : 0;
					muxValue(value as number, [falsevalue, truevalue], truevalueType);
				},
			);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "multiplexer",
		displayName: "Multiplexer",
		description: "Outputs values depending on 'State' input",
		// modelSource: autoModel("TripleGenericLogicBlockPrefab", "MUX", BlockCreation.Categories.other),
		search: {
			aliases: ["mux"],
		},

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}
export const BasicLogicGateBlocks: readonly BlockBuilder[] = [
	And.block,
	Or.block,
	Nand.block,
	Nor.block,
	Xor.block,
	Xnor.block,
	Not.block,
	Mux.block,
];
