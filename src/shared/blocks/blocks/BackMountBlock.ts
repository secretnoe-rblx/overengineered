import { Players, RunService } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { Keys } from "engine/shared/fixes/Keys";
import { PlayerInfo } from "engine/shared/PlayerInfo";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { SharedMachine } from "shared/blockLogic/SharedMachine";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		detach: {
			displayName: "Attach/Detach",
			tooltip: "Attach or detach the back mount.",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: true,
							key: "H" as KeyCode,
							switch: false,
							reversed: false,
						},
						canBeSwitch: false,
						canBeReversed: false,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type BackMountModel = BlockModel & {
	PlayerWeldConstraint: WeldConstraint;
	DragDetector: DragDetector;
};

export type { Logic as BackMountBlockLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, BackMountModel> {
	static readonly events = {
		init: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
		}>("backmount_init"),
		weldMountToPlayer: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly humanoid: Humanoid;
		}>("backmount_weld"),
		unweldMountFromPlayer: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
		}>("backmount_unweld"),
	} as const;

	constructor(block: InstanceBlockLogicArgs, @inject machine: SharedMachine) {
		super(definition, block);

		if (!RunService.IsClient()) return;
		//get humanoid
		let humanoid: Humanoid | undefined;
		const pp = new Instance("ProximityPrompt");
		pp.Enabled = true;
		pp.KeyboardKeyCode = Keys[this.definition.input.detach.types.bool.control.config.key];
		pp.ActionText = "Attach";
		pp.MaxActivationDistance = 12;
		pp.Parent = this.instance;

		this.onEnable(() => {
			const stuff = this.parent(new PlayerInfo(Players.LocalPlayer));
			humanoid = stuff.humanoid.get();
			if (!humanoid) return;
			Logic.events.init.send({ block: this.instance });

			this.event.subscribe(pp.Triggered, () => {
				if (!humanoid) return;
				Logic.events.weldMountToPlayer.send({ block: this.instance, humanoid });
				pp.Enabled = false;
			});
		});

		this.onk(["detach"], ({ detach }) => {
			if (!humanoid) return;
			if (!detach) return;
			if (pp.Enabled) return;
			Logic.events.unweldMountFromPlayer.send({ block: this.instance });
			pp.Enabled = true;
		});

		this.onDisable(() => {
			Logic.events.unweldMountFromPlayer.send({ block: this.instance });
		});
	}
}

export const BackMountBlock = {
	...BlockCreation.defaults,
	id: "backmount",
	displayName: "Back Mount",
	description: "A mountable backpack. You can weld stuff to it and wear it.",
	limit: 15,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
