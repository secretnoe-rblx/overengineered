import { Players, RunService, UserInputService } from "@rbxts/services";
import { EventHandler } from "engine/shared/event/EventHandler";
import { A2SRemoteEvent, C2CRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { Keys } from "engine/shared/fixes/Keys";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BuildingManager } from "shared/building/BuildingManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
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

		connectToRootPart: {
			displayName: "RootPart attachment",
			tooltip: "Make back mount attached to your RootPart instead of your actual back.",
			types: {
				bool: {
					config: true,
				},
			},
			connectorHidden: true,
		},

		shared: {
			displayName: "Shared",
			tooltip: "Allows other players to wear your back mount.",
			types: {
				bool: {
					config: false,
				},
			},
			connectorHidden: true,
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
	ProximityPrompt: ProximityPrompt;
	mainPart: BasePart;
	PlayerWeldConstraint: Motor6D;
};

export type { Logic as BackMountBlockLogic };

const blocks = new Map<BackMountModel, EventHandler>();

const remove = (block: BackMountModel, owner: Player) => {
	const eh = blocks.get(block);
	if (!eh) return;

	eh.unsubscribeAll();

	const weld = block.FindFirstChild("PlayerWeldConstraint") as Motor6D | undefined;
	const humanoid = Players.LocalPlayer.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
	if (humanoid && weld?.Part1 && humanoid.IsAncestorOf(weld.Part1)) {
		detach(block, owner);
	}
};
const init = ({
	owner,
	block,
	key,
	connectToRootPart,
}: {
	readonly owner: Player;
	readonly block: BackMountModel;
	readonly connectToRootPart: boolean;
	readonly key: KeyCode;
}) => {
	if (blocks.has(block)) return;

	const eh = new EventHandler();
	blocks.set(block, eh);

	const pp = block.ProximityPrompt;
	pp.KeyboardKeyCode = Keys.Keys[key];
	pp.Triggered.Connect(() => {
		// fix teleporting to 000; todo make a better fix later
		for (const b of BuildingManager.getMachineBlocks(block)) {
			for (const child of b.GetDescendants()) {
				if (!child.IsA("BasePart")) continue;

				child.FindFirstChild("_AlignPosition")?.Destroy();
				child.FindFirstChild("_AlignOrientation")?.Destroy();
			}
		}

		Logic.events.weldMountToPlayer.send({ block, connectToRootPart });
	});

	block.Destroying.Connect(() => remove(block, owner));

	const humanoid = Players.LocalPlayer.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
	if (humanoid) {
		eh.subscribe(humanoid.Died, () => detach(block, owner));
	}

	eh.subscribe(UserInputService.InputBegan, (input, gameProccessed) => {
		if (gameProccessed) return;
		if (input.KeyCode !== pp.KeyboardKeyCode) return;

		detach(block, owner);
	});

	block.ProximityPrompt.Enabled = !block.PlayerWeldConstraint.Enabled;
	eh.subscribe(block.PlayerWeldConstraint.GetPropertyChangedSignal("Enabled"), () => {
		block.ProximityPrompt.Enabled = !block.PlayerWeldConstraint.Enabled;
	});
};
const detach = (block: BackMountModel, owner: Player) => {
	Logic.events.unweldMountFromPlayer.send({ block, owner });
};

class Logic extends InstanceBlockLogic<typeof definition, BackMountModel> {
	static readonly events = {
		initServer: new A2SRemoteEvent<{
			block: BackMountModel;
			key: KeyCode;
			connectToRootPart: boolean;
			owner: Player;
		}>("backmount_initServer", "RemoteEvent"),
		weldMountToPlayer: new A2SRemoteEvent<{
			readonly block: BackMountModel;
			readonly connectToRootPart: boolean;
		}>("backmount_weld", "RemoteEvent"),
		unweldMountFromPlayer: new A2SRemoteEvent<{
			readonly owner: Player;
			readonly block: BackMountModel;
		}>("backmount_unweld", "RemoteEvent"),
		initClient: new C2CRemoteEvent<{
			readonly owner: Player;
			readonly block: BackMountModel;
			readonly connectToRootPart: boolean;
			readonly key: KeyCode;
		}>("backmount_init", "RemoteEvent"),
		disable: new C2CRemoteEvent<{
			readonly owner: Player;
			readonly block: BackMountModel;
		}>("backmount_disable", "RemoteEvent"),
	} as const;

	static {
		if (RunService.IsClient()) {
			this.events.initClient.invoked.Connect(init);
			this.events.disable.invoked.Connect(({ block, owner }) => remove(block, owner));
		}
	}

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(this.instance.PlayerWeldConstraint, "Enabled"),
			(enabled) => this.output.mounted.set("bool", !enabled),
		);

		this.onk(["detachKey", "connectToRootPart", "shared"], ({ detachKey, connectToRootPart, shared }) => {
			if (!Keys.isKey(detachKey)) {
				detachKey = this.definition.input.detachKey.types.key.config;
				if (!Keys.isKey(detachKey)) return;
			}

			if (shared) {
				const data = {
					block: this.instance,
					key: detachKey,
					connectToRootPart,
					owner: Players.LocalPlayer,
				};

				// it's fine to send the init event here because these input values cannot be changed (connectorHidden: true)
				Logic.events.initClient.send(data);
				Logic.events.initServer.send(data);
			} else {
				init({ block: this.instance, key: detachKey, connectToRootPart, owner: Players.LocalPlayer });
			}
		});

		this.onk(["detachBool"], ({ detachBool }) => {
			if (!detachBool) return;
			detach(this.instance, Players.LocalPlayer);
		});

		this.onDisable(() => {
			Logic.events.disable.send({ block: this.instance, owner: Players.LocalPlayer });
			Logic.events.unweldMountFromPlayer.send({ block: this.instance, owner: Players.LocalPlayer });
			this.output.mounted.set("bool", false);
		});
	}
}

export const BackMountBlock = {
	...BlockCreation.defaults,
	id: "backmount",
	displayName: "Back Mount",
	description: "A mountable backpack. You can weld stuff to it and wear it.",
	limit: 15,

	search: {
		partialAliases: ["body"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
