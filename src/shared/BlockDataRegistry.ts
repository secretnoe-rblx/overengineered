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

const flatten = <T extends Partial<Record<string, GenericBlockDataRegistry>>>(
	data: T,
): { [kk in { [k in keyof T]: keyof T[k] }[keyof T]]: BlockSetupInformation } => {
	const ret: Partial<Record<string, BlockSetupInformation>> = {};
	for (const [, items] of pairs(data)) {
		for (const [key, value] of pairs(items as GenericBlockDataRegistry)) {
			ret[key] = value;
		}
	}

	return ret as never;
};
const process = (block: BlockSetupInformation): BlockSetupInformation => {
	if (![".", "!", "?", " "].includes(block.description.sub(block.description.size()))) {
		return {
			...block,
			description: block.description + ".",
		};
	}

	return block;
};

const logic = {
	gate: {
		counter: {
			name: "Counter",
			description: "Returns a previous value plus step value.",
			autoWeldShape: "cube",
		},
		impulsegenerator: {
			name: "Impulse Generator",
			description: "A signal generator. Generates meander (a fancy way of saying square-shaped signal).",
		},
		singleimpulse: {
			name: "Single Impulse",
			description: "Converts a bit into a pulse",
		},
		delayblock: {
			name: "Delay Block",
			description: "Returns same value you gave it but with delay",
			autoWeldShape: "cube",
		},
	},
	byte: {},
	vector3: {
		vec3objectworldtransformer: {
			name: "Vector3 Object/World Transformer",
			description: "Converts a vector into the world/object coordinate space of the other vector",
		},
	},
	sensors: {
		anglesensor: {
			name: "Angle Sensor",
			description: "Returns it's angle",
		},
		ownerlocator: {
			name: "Owner Locator",
			description: "Maks, delete this ####",
		},
		ownercameralocator: {
			name: "Owner Camera Locator",
			description: "Returns owner camera position and direction",
		},
		mousesensor: {
			name: "Mouse Sensor",
			description: "Returns the cursor position, relative to the screen",
		},
		radarsection: {
			name: "Radar Section",
			description: "Returns the closest object that got into the block's sight",
			limit: 400,
		},
		tpscounter: {
			name: "TPS Counter",
			description: "Returns the Ticks per Second number",
		},
	},
} satisfies Record<string, GenericBlockDataRegistry>;

/** Registry for the block information, for easier editing (compared to Roblox Studio) */
const registry = {
	...flatten(logic),
	piston: {
		name: "Piston",
		description: "No Pi jokes here. It just moves stuff..",
		limit: 200,
	},
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
	ballast: {
		name: "Ballast",
		description: "(Un)managable weight of existence. Now in compact form!",
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
	leddisplay: {
		name: "Display",
		description: "Simple 8x8 pixel display. Wonder what can you do with it..",
		limit: 16,
	},
	sevensegmentdisplay: {
		name: "7-Segment Display",
		description: "Simple 7-Segment display. Opcode viewer? OwO",
	},
	disconnectblock: {
		name: "Disconnector",
		description: "Detaches connected parts on a button press",
	},
	driveshaft: {
		name: "Driveshaft",
		description: "A shaft that drives",
	},
	bearingshaft: {
		name: "Bearing Shaft",
		description: "A shaft that bears",
	},
	bracedshaft: {
		name: "Braced Shaft",
		description: "A shaft with adjustable braces",
	},
	heliumblock: {
		name: "Helium",
		description: "I still have no idea how did they manage to pump helium into soap",
	},
	hingeblock: {
		name: "Hinge",
		description: "A simple hinge. Allows things to rotate in one plane",
	},
	smallhingeblock: {
		name: "Small hinge",
		description: "Smaller hinge. La rotación compacta",
	},
	logicmemory: {
		name: "Memory Cell",
		description: "Stores the value you gave it",
	},
	magnet: {
		name: "Magnet",
		description: "A magnet. Attracts to different polarity, repels from same polarity",
		limit: 200,
	},
	motorblock: {
		name: "Motor",
		description: "Rotates attached blocks",
		limit: 100,
	},
	randomaccessmemory: {
		name: "RAM",
		description: "An addressed memory. Allows you to store up to 256 values",
	},
	readonlymemory: {
		name: "ROM",
		description: "A programmable memory. Allows you to read values you've written in",
		limit: 1,
	},
	relay: {
		name: "Relay",
		description: "Returns an input value only when told to",
	},
	rocketengine: {
		name: "Rocket Engine",
		description: "Engines your rocket into the space and onto the ground",
		mirrorBehaviour: "offset180",
		limit: 50,
	},
	smallrocketengine: {
		name: "Small Rocket Engine",
		description: "Smaller brother of a rocket engine",
		mirrorBehaviour: "offset180",
		limit: 50,
	},
	rcsengine: {
		name: "RCS Engine",
		description: "Support engines used to orient a spacecraft",
		mirrorBehaviour: "offset180",
		limit: 50,
	},
	rope: {
		name: "Rope",
		description: "A very VERY robust rope",
	},
	servomotorblock: {
		name: "Servo",
		description: "A configurable motor. Rotates to desired angle",
		limit: 100,
	},
	sidewaysservo: {
		name: "Sideways servo",
		description: "Servo but sideways and with some degree of freedom",
		limit: 100,
	},
	smallgear: {
		name: "Small Gear",
		description: "A cog for your machinery. Does it even work?",
	},
	speedometer: {
		name: "Speedometer",
		description: "Returns the current velocity",
	},
	masssensor: {
		name: "Mass Sensor",
		description: "Returns the current contraption/assembly mass",
	},
	gravitysensor: {
		name: "Gravity Sensor",
		description: "Returns the current gravity acceleration in m/s²",
	},
	stackmemory: {
		name: "Stack",
		description: "Storage for your stacked data. Allows to store up to 32 values",
	},
	suspensionblock: {
		name: "Suspension",
		description: "Sus pension spring",
	},
	tnt: {
		name: "TNT",
		description: "A box of explosives. DO NOT HIT!",
		limit: 100,
	},
	cylindricaltnt: {
		name: "Cylindrical TNT",
		description: "Not a boxed version",
		limit: 100,
	},
	sphericaltnt: {
		name: "Spherical TNT",
		description: "Catch this anarchid-man!",
		limit: 100,
	},
	wing1x1: {
		name: "Wing 1x1",
		description: "A part with advanced aerodynamic properties",
		mirrorBehaviour: "wedgeWing",
	},
	wing1x2: {
		name: "Wing 1x2",
		description: "A part with advanced aerodynamic properties but a bit longer",
		mirrorBehaviour: "wedgeWing",
	},
	wing1x3: {
		name: "Wing 1x3",
		description: "A part with advanced aerodynamic properties but two bits longer",
		mirrorBehaviour: "wedgeWing",
	},
	wing1x4: {
		name: "Wing 1x4",
		description: "A part with advanced aerodynamic properties but the joke is overused",
		mirrorBehaviour: "wedgeWing",
	},
	wingrounding: {
		name: "Wing Rounding",
		description: "A wing rounding. Literally rounds your wing",
	},
	wingsharpening: {
		name: "Wing Sharper",
		description: "An evil brother of the wing rounding",
	},
	radiotransmitter: {
		name: "Radio Transmitter",
		description: "Transmits data over air! True magic for a caveman!",
		limit: 10,
	},
	radioreciever: {
		name: "Radio Reciever",
		description: "Love is in the air? Wrong! Radio wave radia-tion!",
		limit: 10,
	},
} satisfies GenericBlockDataRegistry;

export const BlockDataRegistry: { readonly [id in BlockId]: BlockSetupInformation } = registry;

for (const [key, info] of pairs(registry)) {
	(registry as Writable<GenericBlockDataRegistry>)[key] = process(info);
}
