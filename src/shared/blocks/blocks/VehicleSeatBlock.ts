import { RunService, Players } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { SharedMachine } from "shared/blockLogic/SharedMachine";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {},
	output: {
		occupied: {
			displayName: "Occupied",
			types: {
				bool: { type: "bool" },
			},
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type VehicleSeatModel = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};

export type { Logic as VehicleSeatBlockLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, VehicleSeatModel> {
	readonly vehicleSeat;

	constructor(block: InstanceBlockLogicArgs, @inject machine: SharedMachine) {
		super(definition, block);

		this.vehicleSeat = this.instance.VehicleSeat;

		const update = () => {
			const occupant = this.vehicleSeat.Occupant;
			if (RunService.IsClient()) {
				machine.occupiedByLocalPlayer.set(occupant?.Parent === Players.LocalPlayer.Character);
			}

			this.output.occupied.set("bool", occupant !== undefined);
		};

		this.event.subscribe(this.vehicleSeat.GetPropertyChangedSignal("Occupant"), update);
		this.onEnable(update);
	}
}

export const VehicleSeatBlock = {
	...BlockCreation.defaults,
	id: "vehicleseat",
	displayName: "Driver seat",
	description: "A seat for your vehicle. Allows you to control your contraption",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
