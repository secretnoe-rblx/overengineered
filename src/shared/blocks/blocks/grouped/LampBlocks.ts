import { Colors } from "engine/shared/Colors";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { inferEnumLogicType } from "shared/blockLogic/BlockLogicTypes";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";

const definition = {
	input: {
		enabled: {
			displayName: "Enabled",
			types: BlockConfigDefinitions.bool,
		},
		brightness: {
			displayName: "Brightness",
			types: {
				number: {
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100,
					},
					config: 20,
				},
			},
		},
		color: {
			displayName: "Color",
			types: {
				color: {
					config: Colors.white,
				},
			},
		},
		lightRange: {
			displayName: "Range",
			types: {
				number: {
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 100,
					},
					config: 20,
				},
			},
		},
		colorMixing: {
			displayName: "Color Priority",
			tooltip: "Method of determining the resulting color of this lamp",
			types: {
				enum: inferEnumLogicType({
					config: "paint",
					elementOrder: ["config", "paint", "mixed", "mul"],
					elements: {
						config: { displayName: "Config", tooltip: "Prioritize configured color over paint color" },
						paint: { displayName: "Paint", tooltip: "Prioritize paint color over configured color" },
						mixed: { displayName: "Mixed", tooltip: "Mix configured and paint colors evenly" },
						mul: { displayName: "Multiplication", tooltip: "Multiply configured and paint colors" },
					},
				}),
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

const whiteColor = Color3.fromRGB(255, 255, 255);
const blackColor = Color3.fromRGB(0, 0, 0);

const update = ({ block, state, color, brightness, range }: UpdateData) => {
	const part = block.PrimaryPart;
	if (!part) return;

	const light = part?.FindFirstChild("PointLight") as PointLight | undefined;
	if (!light) return;

	if (state) {
		const commonColor = color ?? whiteColor;
		light.Range = range;
		part.Color = blackColor.Lerp(commonColor, math.clamp(brightness + 0.2, 0, 1));
		light.Color = commonColor;
		part.Material = Enum.Material.Neon;
		light.Brightness = brightness * 10;
		return;
	}

	part.Color = Color3.fromRGB(0, 0, 0);
	part.Material = Enum.Material.SmoothPlastic;
	light.Brightness = 0;
};

const updateEventType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<BlockModel>(),
	state: t.boolean,
	color: t.color.orUndefined(),
	brightness: t.numberWithBounds(0, 100),
	range: t.numberWithBounds(0, 100),
});
type UpdateData = t.Infer<typeof updateEventType>;

const events = {
	update: new BlockSynchronizer("b_lamp_update", updateEventType, update),
} as const;

export type { Logic as LampBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(args: InstanceBlockLogicArgs) {
		super(definition, args);

		const blockColor = BlockManager.manager.color.get(args.instance);

		const colorFunctions: Record<
			keyof (typeof definition)["input"]["colorMixing"]["types"]["enum"]["elements"],
			(configColor: Color3, blockColor: Color3) => Color3
		> = {
			config: (configColor, _) => configColor,
			paint: (_, blockColor) => blockColor,
			mixed: (configColor, blockColor) => configColor.Lerp(blockColor, 0.5),
			mul: (configColor, blockColor) => {
				const redSum = configColor.R * blockColor.R;
				const greenSum = configColor.G * blockColor.G;
				const blueSum = configColor.B * blockColor.B;

				const combinedColorValue = (redSum + greenSum + blueSum) / 255;

				return Color3.fromRGB(
					redSum / combinedColorValue,
					greenSum / combinedColorValue,
					blueSum / combinedColorValue,
				);
			},
		};

		this.on(({ enabled, brightness, lightRange, color, enabledChanged, colorMixing }) => {
			// Send the request only if enabled or enabling
			if (!enabled && !enabledChanged) return;
			const finalColor = colorFunctions[colorMixing](color, blockColor);

			const data: UpdateData = {
				block: this.instance,
				state: enabled,
				color: finalColor,
				brightness: brightness * 0.2, // a.k.a. / 100 * 40 and 30% off
				range: lightRange * 0.6, // a.k.a. / 100 * 60
			};

			events.update.send(data);
		});
	}
}

//

const logic: BlockLogicInfo = { definition, ctor: Logic, events };
const list: BlockBuildersWithoutIdAndDefaults = {
	lamp: {
		displayName: "Lamp",
		description: "A simple lamp. Turns on and off, or doesn't.",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
		logic,
		limit: 150,
	},
	smalllamp: {
		displayName: "Small Lamp",
		description: "A simple lamp but even simpler!",
		weldRegionsSource: BlockCreation.WeldRegions.fAutomatic("cube"),
		logic,
		limit: 150,
	},
};
export const LampBlocks = BlockCreation.arrayFromObject(list);
