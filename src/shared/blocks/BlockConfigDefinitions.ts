import type { BlockConfigType } from "shared/blockLogic/BlockLogic";

export namespace BlockConfigDefinitions {
	export function any(displayName: string, group?: string, additional?: Partial<BlockConfigType>) {
		return {
			displayName,
			group,
			types: {
				bool: {
					config: false as boolean,
				},
				number: {
					config: 0 as number,
				},
				vector3: {
					config: Vector3.zero,
				},
				string: {
					config: "" as string,
				},
				byte: {
					config: 0 as number,
				},
			},
			...(additional ?? {}),
		} as const satisfies BlockConfigType;
	}
}
