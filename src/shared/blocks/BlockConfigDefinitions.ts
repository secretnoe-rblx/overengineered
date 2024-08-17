import type { BlockLogicFullInputDef, BlockLogicFullOutputDef } from "shared/blockLogic/BlockLogic4";

export namespace BlockConfigDefinitions {
	export function any(
		displayName: string,
		group?: string,
		additional?: Partial<Omit<BlockLogicFullInputDef & BlockLogicFullOutputDef, "types">>,
	) {
		return {
			displayName,
			group,
			types: {
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
			},
			...(additional ?? {}),
		} as const satisfies BlockLogicFullInputDef & BlockLogicFullOutputDef;
	}
}
