import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks = {
	cannonbarrel100mm: {
		displayName: "100mm Cannon Barrel",
		description: "N/A",
	},
	cannonbarrel150mm: {
		displayName: "150mm Cannon Barrel",
		description: "N/A",
	},
	cannonbarrel200mm: {
		displayName: "200mm Cannon Barrel",
		description: "N/A",
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

//

const list = {
	...blocks,
} satisfies BlockBuildersWithoutIdAndDefaults;
export const TestBlocks = BlockCreation.arrayFromObject(list);
