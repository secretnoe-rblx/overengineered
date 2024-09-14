import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks = {
	ballinsocket: {
		displayName: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
	},
	ballinsocketangled: {
		displayName: "Ball in Socket (Angled)",
		description: "Angled ball socket for your mechanical ingenuities",
	},

	shaft: {
		displayName: "Shaft",
		description: "A long thin pipe",
	},
	driveshaft: {
		displayName: "Driveshaft",
		description: "A shaft that drives",
	},
	bearingshaft: {
		displayName: "Bearing Shaft",
		description: "A shaft that bears",
	},
	hingeblock: {
		displayName: "Hinge",
		description: "A simple hinge. Allows things to rotate in one plane",
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
