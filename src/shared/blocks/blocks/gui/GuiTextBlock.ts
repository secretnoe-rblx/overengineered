import { RunService } from "@rbxts/services";
import { Colors } from "engine/shared/Colors";
import { Element } from "engine/shared/Element";
import { BlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { dataToString } from "shared/blocks/blocks/ScreenBlock";
import type { RideMode } from "client/modes/ride/RideMode";
import type { BlockLogicArgs, BlockLogicFullBothDefinitions } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: [
		"text",
		"fontSize",
		"position",
		"anchor",
		"rotation",
		"textColor",
		"textTransparency",
		"backgroundColor",
		"backgroundTransparency",
		"format",
		"zIndex",
	],
	input: {
		text: {
			displayName: "Text",
			types: BlockConfigDefinitions.any,
		},
		fontSize: {
			displayName: "Font Size",
			unit: "pt",
			types: {
				number: { config: 14 },
			},
		},
		position: {
			displayName: "Position",
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
		textColor: {
			displayName: "Text Color",
			types: {
				color: { config: Colors.white },
			},
		},
		textTransparency: {
			displayName: "Text Transparency",
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
		format: {
			displayName: "Format",
			types: {
				string: { config: "{}" },
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

		const label = Element.create("TextLabel", {
			Name: `BlockImage${block.instance?.Name}`,
			Font: Enum.Font.Ubuntu,
			TextColor3: Colors.white,
			AutomaticSize: Enum.AutomaticSize.XY,
			BackgroundTransparency: 1,
			Text: "",
			Parent: mode.rideModeScene.guiScreen,
		});
		this.onDisable(() => label.Destroy());

		const replace = (text: string, str: string, newstr: string) => {
			const idx = text.find(str)[0];
			if (idx) {
				return `${text.sub(1, idx - 1)}${newstr}${text.sub(idx + str.size())}`;
			}

			return text;
		};

		const format = this.initializeInputCache("format");
		this.onk(["text"], ({ text }) => (label.Text = replace(format.tryGet() ?? "{}", "{}", dataToString(text))));
		this.onk(["fontSize"], ({ fontSize }) => (label.TextSize = fontSize));
		this.onk(["position"], ({ position }) => (label.Position = new UDim2(position.X, 0, position.Y, 0)));
		this.onk(["rotation"], ({ rotation }) => (label.Rotation = rotation));
		this.onk(["anchor"], ({ anchor }) => (label.AnchorPoint = new Vector2(anchor.X, anchor.Y)));
		this.onk(["textColor"], ({ textColor }) => (label.TextColor3 = textColor));
		this.onk(["textTransparency"], ({ textTransparency }) => (label.TextTransparency = textTransparency));
		this.onk(["backgroundColor"], ({ backgroundColor }) => (label.BackgroundColor3 = backgroundColor));
		this.onk(
			["backgroundTransparency"],
			({ backgroundTransparency }) => (label.BackgroundTransparency = backgroundTransparency),
		);
		this.onk(["zIndex"], ({ zIndex }) => (label.ZIndex = zIndex));
	}
}

export const GuiTextBlock = {
	...BlockCreation.defaults,
	id: "guitext",
	displayName: "GUI Text",
	description: "Writes text on your screen",

	logic: { definition, ctor: Logic },
	modelSource: {
		model: BlockCreation.Model.fAutoCreated("x4GenericGuiLogicBlockPrefab", "TEXT"),
		category: () => BlockCreation.Categories.gui,
	},
} as const satisfies BlockBuilder;
