import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
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

			const value1cache = this.initializeInputCache("value1");
			const value2cache = this.initializeInputCache("value2");

			this.onkRecalcInputs(["value1"], ({ value1 }) => {
				if (!value1) {
					this.output.result.set("bool", false);
					return;
				}

				const value2 = value2cache.tryGet();
				if (value2 === undefined) return;
				this.output.result.set("bool", value1 && value2);
			});
			this.onkRecalcInputs(["value2"], ({ value2 }) => {
				if (!value2) {
					this.output.result.set("bool", false);
					return;
				}

				const value1 = value1cache.tryGet();
				if (value1 === undefined) return;
				this.output.result.set("bool", value2 && value1);
			});
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

			const value1cache = this.initializeInputCache("value1");
			const value2cache = this.initializeInputCache("value2");

			this.onkRecalcInputs(["value1"], ({ value1 }) => {
				if (value1) {
					this.output.result.set("bool", true);
					return;
				}

				const value2 = value2cache.tryGet();
				if (value2 === undefined) return;
				this.output.result.set("bool", value1 || value2);
			});
			this.onkRecalcInputs(["value2"], ({ value2 }) => {
				if (value2) {
					this.output.result.set("bool", true);
					return;
				}

				const value1 = value1cache.tryGet();
				if (value1 === undefined) return;
				this.output.result.set("bool", value2 || value1);
			});
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "or",
		displayName: "OR Gate",
		description: "Returns true when any of the inputs are true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "OR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Nand {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeInputCache("value1");
			const value2cache = this.initializeInputCache("value2");

			this.onkRecalcInputs(["value1"], ({ value1 }) => {
				if (!value1) {
					this.output.result.set("bool", true);
					return;
				}

				const value2 = value2cache.tryGet();
				if (value2 === undefined) return;
				this.output.result.set("bool", !(value1 && value2));
			});
			this.onkRecalcInputs(["value2"], ({ value2 }) => {
				if (!value2) {
					this.output.result.set("bool", true);
					return;
				}

				const value1 = value1cache.tryGet();
				if (value1 === undefined) return;
				this.output.result.set("bool", !(value2 && value1));
			});
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "nand",
		displayName: "NAND Gate",
		description: "Returns true when both inputs are not true",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "NAND", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Nor {
	const definition = defs.bool2_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const value1cache = this.initializeInputCache("value1");
			const value2cache = this.initializeInputCache("value2");

			this.onkRecalcInputs(["value1"], ({ value1 }) => {
				if (value1) {
					this.output.result.set("bool", false);
					return;
				}

				const value2 = value2cache.tryGet();
				if (value2 === undefined) return;
				this.output.result.set("bool", !(value1 || value2));
			});
			this.onkRecalcInputs(["value2"], ({ value2 }) => {
				if (value2) {
					this.output.result.set("bool", false);
					return;
				}

				const value1 = value1cache.tryGet();
				if (value1 === undefined) return;
				this.output.result.set("bool", !(value2 || value1));
			});
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

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			this.onRecalcInputs(({ value1, value2 }) => {
				this.output.result.set("bool", value1 !== value2);
			});
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

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			this.onRecalcInputs(({ value1, value2 }) => {
				this.output.result.set("bool", !(value1 !== value2));
			});
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "xnor",
		displayName: "XNOR Gate",
		description: "Returns true when both of the the inputs are the same",
		modelSource: autoModel("DoubleGenericLogicBlockPrefab", "XNOR", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace Not {
	const definition = defs.bool1_bool;

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			this.onRecalcInputs(({ value }) => {
				this.output.result.set("bool", !value);
			});
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "not",
		displayName: "NOT Gate",
		description: "Returns true when false is given, and vice versa",
		modelSource: autoModel("GenericLogicBlockPrefab", "NOT", BlockCreation.Categories.bool),

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}
namespace Mux {
	const definition = {
		inputOrder: ["value", "truevalue", "falsevalue"],
		input: {
			value: {
				displayName: "State",
				types: BlockConfigDefinitions.bool,
			},
			truevalue: {
				displayName: "True value",
				types: BlockConfigDefinitions.any,
				group: "1",
			},
			falsevalue: {
				displayName: "False value",
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
	};

	class Logic extends BlockLogic<typeof definition> {
		constructor(block: BlockLogicArgs) {
			super(definition, block);

			const valuecache = this.initializeInputCache("value");
			const truevaluecache = this.initializeInputCache("truevalue");
			const falsevaluecache = this.initializeInputCache("falsevalue");

			const update = () => {
				const value = valuecache.tryGet();
				if (value === undefined) return;

				if (value) {
					const ret = truevaluecache.tryGet();
					const rettype = truevaluecache.tryGetType();
					if (ret !== undefined && rettype !== undefined) {
						this.output.result.set(rettype, ret);
					}
				} else {
					const ret = falsevaluecache.tryGet();
					const rettype = falsevaluecache.tryGetType();
					if (ret !== undefined && rettype !== undefined) {
						this.output.result.set(rettype, ret);
					}
				}
			};

			this.onkRecalcInputs(["value"], update);
			this.onkRecalcInputs(["truevalue"], update);
			this.onkRecalcInputs(["falsevalue"], update);
		}
	}

	export const block = {
		...BlockCreation.defaults,
		id: "multiplexer",
		displayName: "Multiplexer",
		description: "Outputs values depending on the incoming boolean",
		modelSource: autoModel("TripleGenericLogicBlockPrefab", "MUX", BlockCreation.Categories.other),

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
