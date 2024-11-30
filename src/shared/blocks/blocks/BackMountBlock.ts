import { Players, RunService, UserInputService } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { EventHandler } from "engine/shared/event/EventHandler";
import { C2CRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { isKey, Keys } from "engine/shared/fixes/Keys";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
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

const remove = (block: BackMountModel) => {
	const eh = blocks.get(block);
	if (!eh) return;

	eh.unsubscribeAll();

	const weld = block.PlayerWeldConstraint;
	const humanoid = Players.LocalPlayer.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;

	if (humanoid && weld?.Part1 && humanoid.IsAncestorOf(weld.Part1)) {
		detach(block);
	}
};
const init = ({
	block,
	key,
	connectToRootPart,
}: {
	readonly block: BackMountModel;
	readonly connectToRootPart: boolean;
	readonly key: KeyCode;
}) => {
	if (blocks.has(block)) return;

	const eh = new EventHandler();
	blocks.set(block, eh);

	const pp = block.ProximityPrompt;
	pp.KeyboardKeyCode = Keys[key];
	pp.Enabled = true;
	pp.Triggered.Connect(() => {
		Logic.events.weldMountToPlayer.send({ block, connectToRootPart });
	});

	block.Destroying.Connect(() => remove(block));

	const humanoid = Players.LocalPlayer.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
	if (humanoid) {
		eh.subscribe(humanoid.Died, () => detach(block));
	}

	eh.subscribe(UserInputService.InputBegan, (input, gameProccessed) => {
		if (gameProccessed) return;
		if (input.KeyCode !== pp.KeyboardKeyCode) return;

		detach(block);
	});

	eh.subscribe(block.PlayerWeldConstraint.GetPropertyChangedSignal("Part1"), () => {
		const part = block.PlayerWeldConstraint.Part1;
		const mounted = part !== undefined;

		block.ProximityPrompt.Enabled = !mounted;
	});
};
const detach = (block: BackMountModel) => {
	Logic.events.unweldMountFromPlayer.send({ block });
};

class Logic extends InstanceBlockLogic<typeof definition, BackMountModel> {
	static readonly events = {
		weldMountToPlayer: new AutoC2SRemoteEvent<{
			readonly block: BackMountModel;
			readonly connectToRootPart: boolean;
		}>("backmount_weld", "RemoteEvent"),
		unweldMountFromPlayer: new AutoC2SRemoteEvent<{
			readonly block: BackMountModel;
		}>("backmount_unweld", "RemoteEvent"),
		initClient: new C2CRemoteEvent<{
			readonly block: BackMountModel;
			readonly connectToRootPart: boolean;
			readonly key: KeyCode;
		}>("backmount_init", "RemoteEvent"),
		disable: new C2CRemoteEvent<{
			readonly block: BackMountModel;
		}>("backmount_disable", "RemoteEvent"),
	} as const;

	static {
		if (RunService.IsClient()) {
			this.events.initClient.invoked.Connect(init);
			this.events.disable.invoked.Connect(({ block }) => remove(block));
		}
	}

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.event.subscribeObservable(
			this.event.readonlyObservableFromInstanceParam(this.instance.PlayerWeldConstraint, "Part1"),
			(part) => {
				const mounted = part !== undefined;
				this.output.mounted.set("bool", mounted);
			},
		);

		this.onk(["detachKey", "connectToRootPart", "shared"], ({ detachKey, connectToRootPart, shared }) => {
			if (!isKey(detachKey)) {
				detachKey = this.definition.input.detachKey.types.key.config;
				if (!isKey(detachKey)) return;
			}

			if (shared) {
				// it's fine to send the init event here because these input values cannot be changed (connectorHidden: true)
				Logic.events.initClient.send({ block: this.instance, key: detachKey, connectToRootPart });
			} else {
				init({ block: this.instance, key: detachKey, connectToRootPart });
			}
		});

		this.onk(["detachBool"], ({ detachBool }) => {
			if (!detachBool) return;
			detach(this.instance);
		});

		this.onDisable(() => {
			Logic.events.disable.send({ block: this.instance });
			Logic.events.unweldMountFromPlayer.send({ block: this.instance });
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

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
