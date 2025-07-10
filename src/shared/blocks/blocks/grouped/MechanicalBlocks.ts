import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuildersWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks: BlockBuildersWithoutIdAndDefaults = {
	anchorblock: {
		displayName: "Anchor",
		description: "An immovable block",
		limit: 20,

		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},

	ballinsocket: {
		displayName: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
		limit: 200,
	},
	ballinsocketangled: {
		displayName: "Ball in Socket (Angled)",
		description: "Angled ball socket for your mechanical ingenuities",
		limit: 75,
	},

	shaft: {
		displayName: "Shaft",
		description: "A long thin pipe",
	},
	driveshaft: {
		displayName: "Driveshaft",
		description: "Kinda like a ball socket but with transmitting rotational force",
		limit: 100,
	},

	smallgear: {
		displayName: "Small Gear",
		description: "A cog for your machinery. Does it even work?",
	},

	spurgear: {
		displayName: "Spur Gear",
		description: "N/A",
		devOnly: true,
	},
	wormgear: {
		displayName: "Worm Gear",
		description: "N/A",
		devOnly: true,
	},
	bevelgear: {
		displayName: "Beval Gear",
		description: "N/A",
		devOnly: true,
	},
	helicalgear: {
		displayName: "Helical Gear",
		description: "N/A",
		devOnly: true,
	},
	gearrack: {
		displayName: "Rack (Gear)",
		description: "N/A",
		devOnly: true,
	},
	sprocketgear: {
		displayName: "Sprocket Gear",
		description: "N/A",
		devOnly: true,
	},

	wingrounding: {
		displayName: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},
	wingsharpening: {
		displayName: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
};

//

export const MechanicalBlocks = BlockCreation.arrayFromObject(blocks);
