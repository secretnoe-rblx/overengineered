import { C2CRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["value", "frequency"],
	input: {
		value: {
			displayName: "Input",
			types: BlockConfigDefinitions.any,
			group: "1",
		},
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
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as RadioTransmitterBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	static readonly sendEvent = new C2CRemoteEvent<{
		readonly frequency: number;
		readonly valueType: BlockLogicTypes.IdListOfType<typeof definition.input.value.types>;
		readonly value: BlockLogicTypes.TypeListOfType<typeof definition.input.value.types>;
	}>("b_radio_transmitter_send", "RemoteEvent");

	private readonly colorFade = Color3.fromRGB(0, 0, 0);
	private readonly originalColor;

	constructor(block: BlockLogicArgs) {
		super(definition, block);

		const led = block.instance?.FindFirstChild("LED") as BasePart | undefined;
		this.originalColor = led?.Color ?? Colors.black;

		this.on(({ value, valueType, frequency }) => {
			this.blinkLed();
			Logic.sendEvent.send({ frequency, value, valueType });
		});
	}

	blinkLed() {
		const led = this.instance?.FindFirstChild("LED") as BasePart | undefined;
		if (!led) return;

		led.Color = this.colorFade;
		task.delay(0.1, () => (led.Color = this.originalColor));
	}
}

export const RadioTransmitterBlock = {
	...BlockCreation.defaults,
	id: "radiotransmitter",
	displayName: "Radio Transmitter",
	description: "Transmits data over air for EVERYONE! True magic for a caveman!",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
