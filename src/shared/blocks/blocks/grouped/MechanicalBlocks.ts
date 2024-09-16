import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks = {
	anchorblock: {
		displayName: "Anchor",
		description: "An immovable block",
		limit: 20,

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},

	ballinsocket: {
		displayName: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
		limit: 50,
	},
	ballinsocketangled: {
		displayName: "Ball in Socket (Angled)",
		description: "Angled ball socket for your mechanical ingenuities",
		limit: 50,
	},

	shaft: {
		displayName: "Shaft",
		description: "A long thin pipe",
	},
	driveshaft: {
		displayName: "Driveshaft",
		description: "A shaft that drives",
		limit: 50,
	},
	bearingshaft: {
		displayName: "Bearing Shaft",
		description: "A shaft that bears",
	},
	hingeblock: {
		displayName: "Hinge",
		description: "A simple hinge. Allows things to rotate in one plane",
		limit: 50,
	},
	smallhingeblock: {
		displayName: "Small hinge",
		description: "Smaller hinge. La rotación compacta",
	},

	smallgear: {
		displayName: "Small Gear",
		description: "A cog for your machinery. Does it even work?",
	},
	wingrounding: {
		displayName: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},
	wingsharpening: {
		displayName: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;

//

const list = {
	...blocks,
} satisfies BlockBuildersWithoutIdAndDefaults;
export const MechanicalBlocks = BlockCreation.arrayFromObject(list);

export type MechanicalBlockIds = keyof typeof list;
