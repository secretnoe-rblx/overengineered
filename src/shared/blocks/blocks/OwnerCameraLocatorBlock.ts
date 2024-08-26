import { Workspace } from "@rbxts/services";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { GameDefinitions } from "shared/data/GameDefinitions";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	outputOrder: ["position", "direction", "up"],
	input: {},
	output: {
		position: {
			displayName: "Position",
			types: ["vector3"],
		},
		direction: {
			displayName: "Direction",
			types: ["vector3"],
		},
		up: {
			displayName: "Up vector",
			types: ["vector3"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as OwnerCameraLocatorBlockLogic };
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs) {
		super(definition, block);

		this.onTick(() => {
			const camera = Workspace.CurrentCamera;
			if (!camera) return;

			this.output.position.set(
				"vector3",
				camera.CFrame.Position.add(new Vector3(0, GameDefinitions.HEIGHT_OFFSET, 0)),
			);
			this.output.direction.set("vector3", camera.CFrame.LookVector);
			this.output.up.set("vector3", camera.CFrame.UpVector);
		});
	}
}

export const OwnerCameraLocatorBlock = {
	...BlockCreation.defaults,
	id: "ownercameralocator",
	displayName: "Owner Camera Locator",
	description: "Returns owner camera position and direction",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
