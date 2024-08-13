import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockBuilderWithoutIdAndDefaults } from "shared/blocks/Block";

const blocks = {
	block: {
		displayName: "Block",
		description: "Makes you question why every engineering game has it",

		mirror: { behaviour: "none" },
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	truss: {
		displayName: "Truss",
		description: "Climbable and veeeery cool.",

		mirror: { behaviour: "none" },
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
	},
	ball: {
		displayName: "Ball",
		description: "it could be a cannon ball.. Or anything else, really..",

		mirror: { behaviour: "none" },
	},
	halfball: {
		displayName: "Half Ball",
		description: "It's rolling around.. half of the time..",

		mirror: { behaviour: "offset180" },
	},
	cone: {
		displayName: "Cone",
		description: "Filled with weird geometry jokes. Sadly, no ice cream",

		mirror: { behaviour: "normal" },
	},
	halfcone: {
		displayName: "Half Cone",
		description: "As half as much geometry jokes in this one. Still no ice cream tho...",

		mirror: { behaviour: "normal" },
	},
	halfblock: {
		displayName: "Half Block",
		description: "Like a block, but with a small caveat...",
	},
} as const satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

const beams = {
	beam2x1: {
		displayName: "Beam 2x1",
		description: "A block, but 2x1!",
	},
	beam3x1: {
		displayName: "Beam 3x1",
		description: "A block, but 3x1!!",
	},
	beam4x1: {
		displayName: "Beam 4x1",
		description: "A block, but 4x1!!!",
	},
} as const satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

const cornerWedges = {
	concavecornerwedge: {
		displayName: "Concave Corner Wedge",
		description: "The convex corner wedge, but concave",

		mirror: { behaviour: "offset270" },
	},
	convexcornerwedge: {
		displayName: "Convex Corner Wedge",
		description: "The concave corner wedge, but convex",

		mirror: { behaviour: "offset270" },
	},
	cornerwedge1x1: {
		displayName: "Corner Wedge 1x1",
		description: "A simple corner wedge",

		mirror: { behaviour: "offset270" },
	},
	cornerwedge2x1: {
		displayName: "Corner Wedge 2x1",
		description: "A simple corner weedge",

		mirror: { behaviour: "offset270" },
	},
	cornerwedge3x1: {
		displayName: "Corner Wedge 3x1",
		description: "A simple corner weeedge",

		mirror: { behaviour: "offset270" },
	},
	cornerwedge4x1: {
		displayName: "Corner Wedge 4x1",
		description: "A simple corner weeeedge",

		mirror: { behaviour: "offset270" },
	},
	innercorner: {
		displayName: "Inner Corner",
		description: "An inner corner. Some long time ago it was called an Inner Wedge.. Good times!",

		mirror: { behaviour: "offset270" },
	},
	innertetra: {
		displayName: "Inner Tetra",
		description: "This name was chosen just to make the searching more inconvenient",

		mirror: { behaviour: "offset270" },
	},
	tetrahedron: {
		displayName: "Tetrahedron",
		description: "bro what is this naming",

		mirror: { behaviour: "offset90" },
	},
	tetraround: {
		displayName: "Tetra Round",
		description: "A rounded version of the tetrahedron",

		mirror: { behaviour: "offset270" },
	},
	halfcornerwedge1x1: {
		displayName: "Half Corner Wedge 1x1",
		description: "A corner wedge 1x1, but it's.. half.. the size?",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge1x1mirrored" },
	},
	halfcornerwedge2x1: {
		displayName: "Half Corner Wedge 2x1",
		description: "A corner wedge 2x1, but it's.. half.. the size?",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge2x1mirrored" },
	},
	halfcornerwedge3x1: {
		displayName: "Half Corner Wedge 3x1",
		description: "A corner wedge 3x1, but it's.. half.. the size?",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge3x1mirrored" },
	},
	halfcornerwedge4x1: {
		displayName: "Half Corner Wedge 4x1",
		description: "It stopped making any sense..",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge4x1mirrored" },
	},
	halfcornerwedge1x1mirrored: {
		displayName: "Half Corner Wedge 1x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge1x1" },
	},
	halfcornerwedge2x1mirrored: {
		displayName: "Half Corner Wedge 2x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge2x1" },
	},
	halfcornerwedge3x1mirrored: {
		displayName: "Half Corner Wedge 3x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge3x1" },
	},
	halfcornerwedge4x1mirrored: {
		displayName: "Half Corner Wedge 4x1 (Mirrored)",
		description: "Same halved corner wedge, but mirrored!",

		mirror: { behaviour: "offset270", replacementId: "halfcornerwedge4x1" },
	},
} as const satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

const cylinders = {
	cylinder1x1: {
		displayName: "Cylinder 1x1",
		description: "A simple cyllinder",
	},
	cylinder1x2: {
		displayName: "Cylinder 1x2",
		description: "A not-so-simple cyllinder",
	},
	cylinder2x1: {
		displayName: "Cylinder 2x1",
		description: "A wider sibling of 1x1 cyllinder",
	},
	cylinder2x2: {
		displayName: "Cylinder 2x2",
		description: "A bigger sibling of 2x1 cyllinder",
	},
	halfcylinder1x1: {
		displayName: "Half Cylinder 1x1",
		description: "A half of a sibling of 1x1 cyllinder",
	},
	halfcylinder1x2: {
		displayName: "Half Cylinder 1x2",
		description: "A bigger half of a sibling of 1x1 cyllinder",
	},
	halfcylinder2x1: {
		displayName: "Half Cylinder 2x1",
		description: "Same as 1x2 half cyllinder but wider",
	},
	halfcylinder2x2: {
		displayName: "Half Cylinder 2x2",
		description: "Same as 1x2 half cyllinder but wider and longer",
	},
} as const satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

const wedges = {
	concaveprism: {
		displayName: "Concave Prism",
		description: "The convex prism, but concave",

		mirror: { behaviour: "offset180" },
	},
	convexprism: {
		displayName: "Convex Prism",
		description: "The concave prism, but convex",

		mirror: { behaviour: "offset180" },
	},
	pyramid: {
		displayName: "Pyramid",
		description: "triangel",
	},
	wedge1x1: {
		displayName: "Wedge 1x1",
		description: "A simple wedge",
	},
	wedge1x2: {
		displayName: "Wedge 1x2",
		description: "A longer wedge",
	},
	wedge1x3: {
		displayName: "Wedge 1x3",
		description: "A longer longer wedge",
	},
	wedge1x4: {
		displayName: "Wedge 1x4",
		description: "A loooonger wedge",
	},
	halfwedge1x1: {
		displayName: "Half Wedge 1x1",
		description: "A wedge 1x1, but it's.. half.. the size?",
	},
	halfwedge1x2: {
		displayName: "Half Wedge 1x2",
		description: "A wedge 1x2, but it's.. half.. the size?",
	},
	halfwedge1x3: {
		displayName: "Half Wedge 1x3",
		description: "A wedge 1x3, but it's.. half.. the size?",
	},
	halfwedge1x4: {
		displayName: "Half Wedge 1x4",
		description: "A wedge 1x4, but it's.. half.. the size?",
	},
} as const satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

const wheels = {
	wheel: {
		displayName: "Wheel",
		description: "circle",
	},
	bigwheel: {
		displayName: "Big wheel",
		description: "Wheel. Big one.",
	},
	smalloldwheel: {
		displayName: "Small old wheel",
		description: "smol ol whel",
	},
	oldwheel: {
		displayName: "Old wheel",
		description: "A ginormous old wheel",
	},
	bigoldwheel: {
		displayName: "Big old wheel",
		description: "Old wheel. Big one.",
	},
} as const satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

//

const list = {
	...blocks,
	...beams,
	...cornerWedges,
	...cylinders,
	...wedges,
	...wheels,
} satisfies { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };
export const BuildingBlocks = BlockCreation.arrayFromObject(list);

export type BuildingBlockIds = keyof typeof list;
