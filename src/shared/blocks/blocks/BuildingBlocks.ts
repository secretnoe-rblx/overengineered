import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuilder } from "shared/blocks/BlockCreation";

const Block = {
	...BlockCreation.defaults,
	id: "block",
	displayName: "Block",
	description: "Makes you question why every engineering game has it",

	weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
} as const satisfies BlockBuilder;

//

export const BuildingBlocks = [
	Block,
	//
] as const satisfies BlockBuilder[];
