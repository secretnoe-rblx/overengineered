import { RunService, Players } from "@rbxts/services";
import { BlockLogicActor } from "shared/blockLogic/BlockLogic3";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockConfigBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockTickState } from "shared/blockLogic/BlockLogic3";
import type { SharedMachine } from "shared/blockLogic/SharedMachine";
import type { BlockBuilder } from "shared/blocks/Block";

const config = {
	input: {},
	output: {
		occupied: {
			displayName: "Occupied",
			types: {
				bool: {
					config: false,
				},
			},
		},
	},
} satisfies BlockConfigBothDefinitions;

type VehicleSeatModel = BlockModel & {
	readonly VehicleSeat: VehicleSeat;
};

@injectable
export class VehicleSeatBlockLogic extends BlockLogicActor<typeof config, VehicleSeatModel> {
	readonly vehicleSeat;

	constructor(block: PlacedBlockData, @inject machine: SharedMachine) {
		super(config, block);

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

	protected tick(ctx: BlockTickState): void {}
}

export const VehicleSeatBlock = {
	...BlockCreation.defaults,
	id: "vehicleseat",
	displayName: "Driver seat",
	description: "A seat for your vehicle. Allows you to control your contraption",

	logic: { config, ctor: VehicleSeatBlockLogic },
} as const satisfies BlockBuilder;
