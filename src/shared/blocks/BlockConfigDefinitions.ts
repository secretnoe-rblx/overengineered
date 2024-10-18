import type { BlockLogicFullInputDef } from "shared/blockLogic/BlockLogic";

export const BlockConfigDefinitions = {
	any: {
		bool: { config: false },
		number: { config: 0 },
		vector3: { config: Vector3.zero },
		string: { config: "" },
		byte: { config: 0 },
	},
	number: {
		number: { config: 0 },
	},
	string: {
		string: { config: "" },
	},
	bool: {
		bool: { config: false },
	},
	byte: {
		byte: { config: 0 },
	},
	vector3: {
		vector3: { config: new Vector3(0, 0, 0) },
	},
	color: {
		color: { config: new Color3(0, 0, 0) },
	},
} as const satisfies { readonly [k in string]: BlockLogicFullInputDef["types"] };
