import { RunService } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import type { Beacon } from "client/gui/Beacon";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		enabled: {
			displayName: "Enabled",
			tooltip: "Enable/disable beacon visibility.",
			unit: "state",
			types: {
				bool: {
					config: true,
				},
			},
		},
		text: {
			displayName: "Text",
			tooltip: "The text that will appear under the beacon's marker.",
			types: {
				string: {
					config: "New Beacon",
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type beaconBlock = BlockModel & {
	LED: BasePart;
};

interface UpdateData {
	readonly block: beaconBlock;
	readonly color: Color3;
}

export type { Logic as BeaconBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<UpdateData>("beacon_update"),
	} as const;

	static updateLedColor(data: UpdateData) {
		if (!data.block) return;
		data.block.LED.Color = data.color;
	}

	beaconInstance: Beacon | undefined;
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		let timePassed = 0;
		const maxTimeInSeconds = 1;
		const tagetColor = Colors.green;
		const startColor = Colors.black;

		const en = this.initializeInputCache("enabled");
		const beacon: beaconBlock = this.instance as beaconBlock;

		const updateColor = (color: Color3) => {
			const data: UpdateData = {
				block: beacon,
				color: color,
			};

			Logic.updateLedColor(data);
			Logic.events.update.send(data);
		};

		this.event.subscribe(RunService.Heartbeat, (seconds) => {
			// ладно, я знаю как сделать хитрожопо, но потом хуй прочитаешь
			// да и тем более это было не оптимизировано
			if (!en.get()) {
				timePassed = 0;
				return updateColor(startColor);
			}

			timePassed = (timePassed + seconds) % maxTimeInSeconds;
			const progress = 1 - timePassed / maxTimeInSeconds;

			updateColor(startColor.Lerp(tagetColor, progress));
		});

		this.onk(["text", "enabled"], ({ text, enabled }) => {
			this.updateData(text, enabled);
		});

		this.onDestroy(() => this.beaconInstance?.destroy());
	}

	//ВЫЗЫВАЕТСЯ ИЗ ВНЕ (RideModeScene.ts)! НЕ МЕНЯТЬ!
	updateData(text: string, enabled: boolean) {
		if (this.beaconInstance === undefined) return;
		this.beaconInstance.billboard.Title.Text = text;
		this.beaconInstance.setEnabled(enabled);
	}
}

export const BeaconBlock = {
	...BlockCreation.defaults,
	id: "beacon",
	displayName: "Beacon",
	description: "Switchable marker. Only you can see it.",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
