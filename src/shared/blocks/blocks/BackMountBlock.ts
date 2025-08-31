import { Players, RunService, UserInputService, Workspace } from "@rbxts/services";
import { EventHandler } from "engine/shared/event/EventHandler";
import { A2SRemoteEvent, S2CRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
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

// declaring constants here
const MAX_PROMPT_VISIBILITY_DISTANCE = 5;
const MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED = 15;

const updateProximity = ({ block, key, isPublic, owner, connectToRootPart }: proximityInferedType) => {
	const pp = block.FindFirstChild("ProximityPrompt") as typeof block.ProximityPrompt;
	if (!pp) return;

	// set activation key
	const k = Enum.KeyCode[key as unknown as never];
	pp.KeyboardKeyCode = k;
	pp.GamepadKeyCode = k;

	const handler = new EventHandler();

	// subscribe to block being destroyed
	handler.subscribe(block.ChildRemoved, () => handler.unsubscribeAll());

	// subscribe to keypress
	handler.subscribe(UserInputService.InputBegan, (input, gameProccessed) => {
		if (gameProccessed) return;
		if (input.KeyCode !== k) return;

		// add extra chech that it is welded to this player
		// we do not want to spam with remote events, do we?
		const cnstr = block.FindFirstChild("PlayerWeldConstraint") as typeof block.PlayerWeldConstraint;
		if (!cnstr) return;
		if (cnstr.Part1) return;

		// unweld
		Logic.events.weldMountUpdate.send({
			block,
			weldedState: false,
			owner,
		});
	});

	handler.subscribe(pp.Triggered, () => {
		// weld because there is no prompt when welded
		Logic.events.weldMountUpdate.send({
			block,
			weldedState: true,
			owner,
			connectToRootPart,
		});
	});

	// some checks so the prompt disappears when player wearing
	const theBlock = block;
	let weldOwner: Player | undefined;

	handler.subscribe(RunService.Heartbeat, () => {
		if (weldOwner !== Players.LocalPlayer) {
			if (!weldOwner) theBlock.ProximityPrompt.MaxActivationDistance = MAX_PROMPT_VISIBILITY_DISTANCE;
			else theBlock.ProximityPrompt.MaxActivationDistance = 0;
			return;
		}
		const camera = Workspace.CurrentCamera;
		if (!camera) return;
		const distance = camera.CFrame.Position.sub(theBlock.mainPart.Position).Magnitude;
		theBlock.ProximityPrompt.MaxActivationDistance =
			distance > MAX_PROMPT_VISIBILITY_DISTANCE_EQUIPPED ? 0 : distance;
	});

	handler.subscribe(Logic.events.updateLogic.invoked, ({ block, weldedTo }) => {
		if (block !== theBlock) return;
		weldOwner = weldedTo;
	});

	// make thing accessible to anyone else
	if (owner !== Players.LocalPlayer) {
		pp.MaxActivationDistance = isPublic ? MAX_PROMPT_VISIBILITY_DISTANCE : 0;
	} else pp.MaxActivationDistance = 5;
	pp.Enabled = isPublic;
};

const proximityEventType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<BackMountModel>(),
	connectToRootPart: t.boolean,
	owner: t.any.as<Player>(),
	isPublic: t.boolean,
	key: t.string,
});

type proximityInferedType = t.Infer<typeof proximityEventType>;

type weldTypeEvent = {
	readonly block: BackMountModel;
	readonly weldedState: boolean;
	readonly owner: Player;
	readonly connectToRootPart?: boolean;
};

type logicUpdateEvent = {
	readonly block: BackMountModel;
	readonly weldedTo: Player | undefined;
};

export type { Logic as BackMountBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, BackMountModel> {
	static readonly events = {
		updateLogic: new S2CRemoteEvent<logicUpdateEvent>("backmount_logic", "RemoteEvent"),
		weldMountUpdate: new A2SRemoteEvent<weldTypeEvent>("backmount_weld", "RemoteEvent"),
		updateProximity: new BlockSynchronizer<proximityInferedType>(
			"backmount_proximity",
			proximityEventType,
			updateProximity,
		),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);
		let weldedToPlayer: Player | undefined;

		// update pressable key
		this.onk(["detachKey", "shared", "connectToRootPart"], ({ detachKey, shared, connectToRootPart }) => {
			Logic.events.updateProximity.send({
				block: this.instance,
				key: detachKey,
				isPublic: shared,
				owner: Players.LocalPlayer,
				connectToRootPart,
			});
		});

		// call weld stuff on detach bool
		this.onk(["detachBool", "connectToRootPart"], ({ detachBoolChanged, detachBool, connectToRootPart }) => {
			if (!detachBoolChanged) return;
			Logic.events.weldMountUpdate.send({
				block: this.instance,
				weldedState: detachBool,
				owner: Players.LocalPlayer,
				connectToRootPart,
			});
		});

		if (RunService.IsClient()) {
			this.event.subscribe(Logic.events.updateLogic.invoked, ({ block, weldedTo }) => {
				if (block !== this.instance) return;
				const isWelded = !!(weldedToPlayer = weldedTo);
				this.output.mounted.set("bool", isWelded);
				const pp = block.FindFirstChild("ProximityPrompt") as typeof block.ProximityPrompt;
				if (!pp) return;
				pp.ActionText = isWelded ? "Detach" : "Attach";
			});
		}
	}
}

export const BackMountBlock = {
	...BlockCreation.defaults,
	id: "backmount",
	displayName: "Back Mount",
	description: "A mountable backpack. You can weld stuff to it and wear it.",
	limit: 15,

	search: {
		partialAliases: ["body", "backpack"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
