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
		and: {
			name: "AND Gate",
			description: "Returns true when both inputs are true",
		},
		nand: {
			name: "NAND Gate",
			description: "Returns true when both value are not true",
		},
		nor: {
			name: "NOR Gate",
			description: "Returns true when none of the values are true",
		},
		not: {
			name: "NOT Gate",
			description: "Returns true when false is given, and vice versa",
		},
		or: {
			name: "OR Gate",
			description: "Returns true when any of the inputs are true",
		},
		xnor: {
			name: "XNOR Gate",
			description: "Returns true only if both inputs are the same",
		},
		xor: {
			name: "XOR Gate",
			description: "Returns true only if both inputs are not the same",
		},
		buffer: {
			name: "Buffer",
			description: "Returns the same value it was given. Useful for logic organization",
			autoWeldShape: "none",
		},
		equals: {
			name: "Equals",
			description: "Returns true if two given values are the exact same",
		},
		notequals: {
			name: "NOT Equals",
			description: "Returns true if values are not the same",
		},
		greaterthan: {
			name: "Greater Than",
			description: "Returns true if first value greater than second one",
		},
		greaterthanorequals: {
			name: "Greater Than or Equals",
			description: "Returns true if the first value greater than second one",
		},
		lessthanorequals: {
			name: "Less Than or Equals",
			description: "Returns true if the first value equal to or lesser than second one",
		},
		lessthan: {
			name: "Less Than",
			description: "Returns true if the first value or lesser than second one",
		},
	},
	byte: {
		bytemaker: {
			name: "Byte Maker",
			description: "Makes bytes from bits and pieces",
		},
		bytesplitter: {
			name: "Byte Splitter",
			description: "Another one bytes to bits",
		},
		bytetonumber: {
			name: "Byte To Number",
			description: "Numbers the bytes! Oh, wait.. no.. It converts Bytes to numbers!",
		},
		numbertobyte: {
			name: "Number to Byte",
			description: "Converts number value to the byte value! It's like clamping number between 0 and 255.",
		},
		bytexor: {
			name: "Byte XOR",
			description: "It's the same XOR operation but for each bit of input bytes.",
		},
		bytexnor: {
			name: "Byte XNOR",
			description: "It's the same XNOR operation but for each bit of input bytes.",
		},
		byteand: {
			name: "Byte AND",
			description: "It's the same AND operation but for each bit of input bytes.",
		},
		bytenand: {
			name: "Byte NAND",
			description: "It's the same NAND operation but for each bit of input bytes.",
		},
		byteor: {
			name: "Byte OR",
			description: "It's the same OR operation but for each bit of input bytes.",
		},
		bytenor: {
			name: "Byte NOR",
			description: "It's the same NOR operation but for each bit of input bytes.",
		},
		byterotateright: {
			name: "Byte Rotate Right",
			description: "It rotates the byte right! Don't ask me, don't know either",
		},
		byterotateleft: {
			name: "Byte Rotate Left",
			description: "It rotates the left! Don't ask me, don't know either",
		},
		byteshiftright: {
			name: "Byte Shift Right",
			description: "Shifts bits to right!",
		},
		byteshiftleft: {
			name: "Byte Shift Left",
			description: "Shifts bits to left!",
		},
		bytearithmeticshiftright: {
			name: "Byte Arithmetic Shift Right",
			description: "Honestly, I have ZERO idea what it does, Maks made it.",
		},
		bytenot: {
			name: "Byte NOT",
			description: "It's the same NOT operation but for each bit of input bytes.",
		},
		byteneg: {
			name: "Byte NEGATE",
			description: "Negates the input byte.",
		},
	},
	trigonometry: {
		rand: {
			name: "Random",
			description: `Returns a "random" value between chosen minimum and maximum`,
			autoWeldShape: "cube",
		},

		sqrt: {
			name: "Square Root",
			description: "Square the root out of input value",
		},
		nsqrt: {
			name: "Custom Degree Root",
			description: "Same as the square root but you're allowed to change the degree of it",
		},
		pow: {
			name: "Power",
			description: "Buffs input values",
		},
		tan: {
			name: "Tangent",
			description: "Calculates a tangent of input",
		},
		atan: {
			name: "Arctangent",
			description: "The opposite of the Tangent",
		},
		atan2: {
			name: "Arctangent 2",
			description: "No way they made a sequel",
		},
		sin: {
			name: "Sine",
			description: "Calculates a sine of input",
		},
		asin: {
			name: "Arcsine",
			description: "The opposite of the Sine",
		},
		cos: {
			name: "Cosine",
			description: "Calculates a cosine of input",
		},
		acos: {
			name: "Arccosine",
			description: "The opposite of the Cosine",
		},
		log: {
			name: "Logarithm",
			description: "Calculates a logarithm of the input value with selected base",
		},
		log10: {
			name: "Logarithm (10 base)",
			description: "Calculates a base 10 logarithm of the input value",
		},
		loge: {
			name: "Logarithm (natural)",
			description: "Returns a natural Logarithm of inputed value. Unlike it's evil artificial counterparts..",
		},
		deg: {
			name: "Degrees",
			description: "Returns input value converted to degrees",
		},
		rad: {
			name: "Radians",
			description: "Returns input value converted to radians",
		},
	},
	vector3: {
		vec3combiner: {
			name: "Vector3 Combiner",
			description: "Returns a vector combined from input values",
		},
		vec3splitter: {
			name: "Vector3 Splitter",
			description: "Returns splitted input vector",
		},
		vec3objectworldtransformer: {
			name: "Vector3 Object/World Transformer",
			description: "Converts a vector into the world/object coordinate space of the other vector",
		},
	},
	number: {
		constant: {
			name: "Constant",
			description: "Always returns the value you've set",
		},
		multiplexer: {
			name: "Multiplexer",
			description: "Outputs values depending on the incoming boolean",
			autoWeldShape: "cube",
		},
	},
	output: {
		lamp: {
			name: "Lamp",
			description: "A simple lamp. Turns on when true is passed and turns off when false is passed",
			autoWeldShape: "cube",
		},
		screen: {
			name: "Screen",
			description: "Display all your data for everyone to see!",
			autoWeldShape: "cube",
		},
		laser: {
			name: "Laser pointer",
			description: "shoot beem boom target!",
			autoWeldShape: "cube",
		},
	},
	sensors: {
		altimeter: {
			name: "Altimeter",
			description: "Returns current height",
		},
		anglesensor: {
			name: "Angle Sensor",
			description: "Returns it's angle",
		},
		keysensor: {
			name: "Keyboard Sensor",
			description: "Returns true when the chosen button is pressed",
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
	passengerseat: {
		name: "Passenger Seat",
		description: "Allow your friends to have immesurable fun with you",
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
		limit: 30,
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
	smallrocketengine: {
		name: "Small Rocket Engine",
		description: "Smaller brother of a rocket engine",
		mirrorBehaviour: "offset180",
		limit: 30,
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
	vehicleseat: {
		name: "Driver Seat",
		description: "A seat for your vehicle. Allows you to control your contraption",
		limit: 1,
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
