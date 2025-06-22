import { RunService } from "@rbxts/services";
import { Colors } from "engine/shared/Colors";
import { Element } from "engine/shared/Element";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { RideMode } from "client/modes/ride/RideMode";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: [
		"image",
		"position",
		"size",
		"anchor",
		"rotation",
		"backgroundColor",
		"backgroundTransparency",
		"zIndex",
	],
	input: {
		image: {
			displayName: "Image ID",
			types: {
				string: { config: "17407819496" },
			},
		},
		position: {
			displayName: "Position",
			unit: "Relative Vector3 (0-1)",
			types: {
				vector3: { config: new Vector3(0.5, 0.5) },
			},
		},
		size: {
			displayName: "Size",
			unit: "Relative Vector3 (0-1)",
			types: {
				vector3: { config: new Vector3(0.5, 0.5) },
			},
		},
		anchor: {
			displayName: "Anchor",
			unit: "Relative Vector3 (0-1)",
			types: {
				vector3: { config: new Vector3(0.5, 0.5) },
			},
		},
		rotation: {
			displayName: "Rotation",
			unit: "degrees",
			types: {
				number: { config: 0 },
			},
		},
		backgroundColor: {
			displayName: "Background Color",
			types: {
				color: { config: Colors.black },
			},
		},
		backgroundTransparency: {
			displayName: "Background Transparency",
			types: {
				number: { config: 1 },
			},
		},
		zIndex: {
			displayName: "Z Index",
			types: {
				number: { config: 0 },
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as SpeakerBlockLogic };
@injectable
class Logic extends BlockLogic<typeof definition> {
	constructor(block: BlockLogicArgs, @inject mode: RideMode) {
		super(definition, block);
		if (!RunService.IsClient()) return;

		const label = Element.create("ImageLabel", {
			Name: `BlockImage${block.instance?.Name}`,
			BackgroundTransparency: 1,
			Parent: mode.rideModeScene.guiScreen,
		});
		this.onDisable(() => label.Destroy());

		this.onk(["image"], ({ image }) => (label.Image = `rbxassetid://${image}`));
		this.onk(["position"], ({ position }) => (label.Position = new UDim2(position.X, 0, position.Y, 0)));
		this.onk(["size"], ({ size }) => (label.Size = new UDim2(size.X, 0, size.Y, 0)));
		this.onk(["rotation"], ({ rotation }) => (label.Rotation = rotation));
		this.onk(["anchor"], ({ anchor }) => (label.AnchorPoint = new Vector2(anchor.X, anchor.Y)));
		this.onk(["backgroundColor"], ({ backgroundColor }) => (label.BackgroundColor3 = backgroundColor));
		this.onk(
			["backgroundTransparency"],
			({ backgroundTransparency }) => (label.BackgroundTransparency = backgroundTransparency),
		);
		this.onk(["zIndex"], ({ zIndex }) => (label.ZIndex = zIndex));
	}
}

export const GuiImageBlock = {
	...BlockCreation.defaults,
	id: "guiimage",
	displayName: "GUI Image",
	description: "Draws an image on your screen",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("x4GenericGuiLogicBlockPrefab", "IMAGE"),
		category: () => BlockCreation.Categories.gui,
	},
} as const satisfies BlockBuilder;
