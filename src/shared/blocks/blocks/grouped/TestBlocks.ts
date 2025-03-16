import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks = {} as const satisfies BlockBuildersWithoutIdAndDefaults;

//

const list = {
	...blocks,
} satisfies BlockBuildersWithoutIdAndDefaults;
export const TestBlocks = BlockCreation.arrayFromObject(list);
