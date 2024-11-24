import { Colors } from "engine/shared/Colors";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
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
						step: 0.1,
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
						step: 0.1,
					},
					config: 20,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

interface UpdateData {
	readonly block: BlockModel;
	readonly state: boolean;
	readonly color: Color3 | undefined;
	readonly brightness: number;
	readonly range: number;
}

export type { Logic as LampBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<UpdateData>("lamp_update"),
	} as const;

	constructor(args: InstanceBlockLogicArgs) {
		super(definition, args);

		const blockColor = BlockManager.manager.color.get(args.instance);

		this.on(({ enabled, brightness, lightRange, color, enabledChanged }) => {
			// Send the request only if enabled or enabling
			if (!enabled && !enabledChanged) return;

			const data: UpdateData = {
				block: this.instance,
				state: enabled,
				color: color.Lerp(blockColor, 0.5),
				brightness: brightness * 0.2, // a.k.a. / 100 * 40 and 30% off
				range: lightRange * 0.6, // a.k.a. / 100 * 60
			};

			Logic.update(data);
			Logic.events.update.send(data);
		});
	}

	static update({ block, state, color, brightness, range }: UpdateData) {
		const part = block.PrimaryPart;
		const light = part?.WaitForChild("PointLight") as PointLight;
		if (!part) return;
		if (!light) return;

		if (state) {
			const commonColor = color ?? Color3.fromRGB(255, 255, 255);
			light.Range = range;
			part.Color = commonColor;
			light.Color = commonColor;
			part.Material = Enum.Material.Neon;
			light.Brightness = brightness;
			return;
		}
		part.Color = Color3.fromRGB(0, 0, 0);
		part.Material = Enum.Material.SmoothPlastic;
		light.Brightness = 0;
	}
}

//

const logic: BlockLogicInfo = { definition, ctor: Logic };
const list: BlockBuildersWithoutIdAndDefaults = {
	lamp: {
		displayName: "Lamp",
		description: "A simple lamp. Turns on and off, but doesn't produce light yet.",
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
