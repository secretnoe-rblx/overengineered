import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";

const definition = {
	input: {
		enabled: {
			displayName: "Enabled",
			types: BlockConfigDefinitions.bool,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as LampBlockLogic };
export class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly state: boolean;
			readonly color: Color3 | undefined;
		}>("lamp_update"),
	} as const;

	constructor(args: InstanceBlockLogicArgs) {
		super(definition, args);

		const color = BlockManager.manager.color.get(args.instance);

		this.on(({ enabled }) => {
			Logic.events.update.send({
				block: this.instance,
				state: enabled,
				color: color,
			});
		});
	}
}

//

const logic: BlockLogicInfo = { definition, ctor: Logic };
const list = {
	lamp: {
		displayName: "Lamp",
		description: "A simple lamp. Turns on and off, but doesn't produce light yet.",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
		logic,
	},
	smalllamp: {
		displayName: "Small Lamp",
		description: "A simple lamp but even simpler!",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
		logic,
	},
} as const satisfies BlockBuildersWithoutIdAndDefaults;
export const LampBlocks = BlockCreation.arrayFromObject(list);

export type LampBlockIds = keyof typeof list;
