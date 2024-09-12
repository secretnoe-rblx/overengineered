import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { RadioTransmitterBlock } from "shared/blocks/blocks/RadioTransmitterBlock";
import { Colors } from "shared/Colors";
import { Objects } from "shared/fixes/objects";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		frequency: {
			displayName: "Frequency",
			types: {
				number: {
					config: 868,
					clamp: {
						showAsSlider: true,
						min: 434,
						max: 1500,
					},
				},
			},
		},
	},
	output: {
		value: {
			displayName: "Output",
			types: Objects.keys(BlockConfigDefinitions.any),
			group: "1",
		},
	},
} satisfies BlockLogicFullBothDefinitions;

RadioTransmitterBlock.logic.ctor.sendEvent.invoked.Connect(({ frequency, value, valueType }) => {
	Logic.allReceivers.get(frequency)?.forEach((v) => {
		v.setOutput(valueType, value);
		v.blinkLed();
	});
});

export type { Logic as RadioReceiverBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	static readonly allReceivers = new Map<number, Set<Logic>>();
	private readonly colorFade = Color3.fromRGB(0, 0, 0);
	private readonly originalColor;
	private readonly led;

	constructor(block: BlockLogicArgs) {
		super(definition, block);

		this.led = block.instance?.FindFirstChild("LED") as BasePart | undefined;
		this.originalColor = this.led?.Color ?? Colors.black;

		const changeFrequency = (freq: number, prev: number) => {
			if (!Logic.allReceivers.get(freq)) {
				Logic.allReceivers.set(freq, new Set());
			}

			Logic.allReceivers.get(prev)?.delete(this);
			Logic.allReceivers.get(freq)?.add(this);
		};

		let prevFrequency = -1;
		this.on(({ frequency }) => {
			prevFrequency = frequency;
			changeFrequency(frequency, prevFrequency);
		});

		this.onDisable(() => Logic.allReceivers.get(prevFrequency)?.delete(this));
	}

	setOutput(
		valueType: (typeof definition.output.value.types)[number],
		value: BlockLogicTypes.Primitives[(typeof definition.output.value.types)[number]]["default"],
	) {
		this.output.value.set(valueType, value);
	}

	blinkLed() {
		if (!this.led) return;

		this.led.Color = this.colorFade;
		task.delay(0.1, () => (this.led ? (this.led.Color = this.originalColor) : ""));
	}
}

export const RadioReceiverBlock = {
	...BlockCreation.defaults,
	id: "radioreceiver",
	displayName: "Radio Receiver",
	description: "Love is in the air? Wrong! Radio wave radia-tion!",
	limit: 10,

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fFromAssets("radioreciever"),
		category: () => ["Logic", "Communication"],
	},
} as const satisfies BlockBuilder;
