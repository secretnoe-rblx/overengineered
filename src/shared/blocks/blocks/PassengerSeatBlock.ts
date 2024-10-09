import { Players } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type {
	BlockLogicFullBothDefinitions,
	BlockLogicTickContext,
	InstanceBlockLogicArgs,
} from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		occupied: {
			displayName: "Occupied",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type PassengerSeatModel = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};

export type { Logic as PassengerSeatBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, PassengerSeatModel> {
	readonly vehicleSeat;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.vehicleSeat = this.instance.VehicleSeat;

		const update = () => {
			const occupant = this.vehicleSeat.Occupant;
			this.output.occupied.set("bool", occupant !== undefined);
		};

		this.event.subscribe(this.vehicleSeat.GetPropertyChangedSignal("Occupant"), update);
		this.onEnable(update);
	}

	getDebugInfo(ctx: BlockLogicTickContext): readonly string[] {
		const char = this.vehicleSeat.Occupant?.Parent;
		const player = char && Players.GetPlayerFromCharacter(char);

		return [...super.getDebugInfo(ctx), `Occiuped by ${player?.Name}`];
	}
}

export const PassengerSeatBlock = {
	...BlockCreation.defaults,
	id: "passengerseat",
	displayName: "Passenger seat",
	description: "Allow your friends to have immesurable fun with you",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
