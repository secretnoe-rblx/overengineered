import type { BlockLogicFullOutputDef } from "shared/blockLogic/BlockLogic4";

export namespace BlockConfigDefinitions {
	export const any = {
		bool: {
			type: "bool",
			config: false as boolean,
		},
		number: {
			type: "number",
			config: 0 as number,
		},
		// vector3: {
		// 	config: Vector3.zero,
		// },
		// string: {
		// 	config: "" as string,
		// },
		// byte: {
		// 	config: 0 as number,
		// },
	} as const satisfies BlockLogicFullOutputDef["types"];
}
