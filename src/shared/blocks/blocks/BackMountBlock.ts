import { Players, RunService, UserInputService } from "@rbxts/services";
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
		detachKey: {
			displayName: "Attach/Detach",
			tooltip: "Attach or detach the back mount.",
			types: {
				key: {
					config: "H" as KeyCode,
				},
			},
			connectorHidden: true,
		},

		detachBool: {
			displayName: "Attach/Detach",
			tooltip: "Attach or detach the back mount.",
			types: {
				bool: {
					config: false,
				},
			},
			configHidden: true,
		},
	},
	output: {
		mounted: {
			displayName: "Occupied",
			tooltip: "Returns true if player is mounted",
			types: ["bool"],
		},
	},
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

		const pp = new Instance("ProximityPrompt");
		pp.Enabled = true;
		pp.ActionText = "Attach";
		pp.MaxActivationDistance = 12;
		pp.KeyboardKeyCode = Keys[this.definition.input.detachKey.types.key.config];
		pp.Parent = this.instance;
		this.event.subscribe(pp.Triggered, () => {
			const humanoid = stuff.humanoid.get();
			if (!humanoid) return;
			Logic.events.weldMountToPlayer.send({ block: this.instance, humanoid });
			pp.Enabled = false;
		});

		this.onEnable(() => Logic.events.init.send({ block: this.instance }));

		const stuff = this.parent(new PlayerInfo(Players.LocalPlayer));

		const detach = () => {
			const humanoid = stuff.humanoid.get();
			if (!humanoid) return;
			if (pp.Enabled) return;
			Logic.events.unweldMountFromPlayer.send({ block: this.instance });
			pp.Enabled = true;
		};
		this.onk(["detachKey"], ({ detachKey }) => {
			pp.KeyboardKeyCode = Keys[detachKey as KeyCode];
		});

		this.event.subscribe(UserInputService.InputBegan, (input, gameProccessed) => {
			if (gameProccessed) return;
			if (input.KeyCode !== pp.KeyboardKeyCode) return;
			if (!pp.Enabled) return;
			detach();
		});

		this.onk(["detachBool"], ({ detachBool }) => {
			if (!detachBool) return;
			detach();
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
