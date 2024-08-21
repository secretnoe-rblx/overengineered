import type { BlockLogicFullInputDef } from "shared/blockLogic/BlockLogic";

export const BlockConfigDefinitions = {
	any: {
		bool: { type: "bool", config: false as boolean },
		number: { type: "number", config: 0 as number },
		// vector3: {
		// 	config: Vector3.zero,
		// },
		// string: {
		// 	config: "" as string,
		// },
		// byte: {
		// 	config: 0 as number,
		// },
	},
	number: {
		number: { type: "number", config: 0 as number },
	},
} as const satisfies { readonly [k in string]: BlockLogicFullInputDef["types"] };
