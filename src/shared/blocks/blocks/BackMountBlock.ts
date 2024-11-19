import { Players, RunService } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { PlayerInfo } from "engine/shared/PlayerInfo";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { SharedMachine } from "shared/blockLogic/SharedMachine";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		detch: {
			displayName: "Detach",
			tooltip: "Detach the mount",
			types: {
				bool: {
					config: false,
				},
			},
		},
	},
	output: {
		occupied: {
			displayName: "Mounted",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

//z is FORWARD
const forwardVector = Vector3.zAxis;

type BackMountModel = BlockModel & {
	PlayerWeldConstraint: WeldConstraint;
};

export type { Logic as BackMountBlockLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, BackMountModel> {
	static readonly events = {
		init: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly torso: BasePart;
		}>("backmount_init"),
		weldMountToPlayer: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly torso: BasePart;
		}>("backmount_weld"),
		unweldMountFromPlayer: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly torso: BasePart;
		}>("backmount_unweld"),
	} as const;

	constructor(block: InstanceBlockLogicArgs, @inject machine: SharedMachine) {
		super(definition, block);

		if (!RunService.IsClient()) return;
		//get humanoid

		this.onEnable(() => {
			const stuff = this.parent(new PlayerInfo(Players.LocalPlayer));
			const humanoid: Humanoid | undefined = stuff.humanoid.get();
			const torso = humanoid?.RootPart;
			print(humanoid, torso);
			if (!torso) return;

			Logic.events.init.send({ block: this.instance, torso });
		});

		//Logic.events.weldMountToPlayer.send({ block: this.instance, torso });
	}

	/*

idk either, man

	getDebugInfo(ctx: BlockLogicTickContext): readonly string[] {
		const char = this.vehicleSeat.Occupant?.Parent;
		const player = char && Players.GetPlayerFromCharacter(char);

		return [...super.getDebugInfo(ctx), `${"replace" ? "Not o" : "O"}cciuped by ${player?.Name}`];
	}
		*/
}

export const BackMountBlock = {
	...BlockCreation.defaults,
	id: "backmount",
	displayName: "Back Mount",
	description: "A mountable backpack. You can weld stuff to it and wear it.",
	limit: 1,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
