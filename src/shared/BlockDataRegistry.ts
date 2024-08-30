export type AutoWeldColliderBlockShape = "none" | "cube";
export type BlockMirrorBehaviour = "offset90" | "offset180" | "offset270" | "normal" | "none" | "wedgeWing";

interface BlockSetupInformation {
	readonly name: string;
	readonly description: string;
	readonly autoWeldShape?: AutoWeldColliderBlockShape;
	readonly mirrorBehaviour?: BlockMirrorBehaviour;
	readonly mirrorReplacementId?: string;
	readonly required?: boolean;
	readonly limit?: number;
}

type GenericBlockDataRegistry = Record<string, BlockSetupInformation>;

const registry = {
	cannonbarrel100mm: {
		name: "100mm Cannon Barrel",
		description: "N/A",
	},
	cannonbarrel150mm: {
		name: "150mm Cannon Barrel",
		description: "N/A",
	},
	cannonbarrel200mm: {
		name: "200mm Cannon Barrel",
		description: "N/A",
	},
	plasmacoilaccelerator: {
		name: "Plasma Accelerator",
		description: "N/A",
	},
	anchorblock: {
		name: "Anchor",
		description: "An immovable block",
		limit: 20,
	},
	ballinsocket: {
		name: "Ball in Socket",
		description: "Ball socket for your mechanical ingenuities",
	},
	ballinsocketangled: {
		name: "Ball in Socket (Angled)",
		description: "Angled ball socket for your mechanical ingenuities",
	},
	driveshaft: {
		name: "Driveshaft",
		description: "A shaft that drives",
	},
	driveshaftangled: {
		name: "Driveshaft (Angled)",
		description: "An angled shaft that drives",
	},
	bearingshaft: {
		name: "Bearing Shaft",
		description: "A shaft that bears",
	},
	hingeblock: {
		name: "Hinge",
		description: "A simple hinge. Allows things to rotate in one plane",
	},
	smallhingeblock: {
		name: "Small hinge",
		description: "Smaller hinge. La rotación compacta",
	},
	rcsengine: {
		name: "RCS Engine",
		description: "Support engines used to orient a spacecraft",
		mirrorBehaviour: "offset180",
		limit: 50,
	},
	smallgear: {
		name: "Small Gear",
		description: "A cog for your machinery. Does it even work?",
	},
	wingrounding: {
		name: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},
	wingsharpening: {
		name: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
} satisfies GenericBlockDataRegistry;
