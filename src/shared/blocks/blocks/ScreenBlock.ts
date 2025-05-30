import { Strings } from "engine/shared/fixes/String.propmacro";
import { t } from "engine/shared/t";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		data: {
			displayName: "Data",
			types: BlockConfigDefinitions.any,
		},
		textColor: {
			displayName: "Text Color",
			types: {
				color: {
					config: new Color3(1, 1, 1),
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type ScreenBlock = BlockModel & {
	readonly Part: BasePart & {
		readonly SurfaceGui: SurfaceGui & {
			readonly TextLabel: TextLabel;
		};
	};
};

const updateEventType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<ScreenBlock>(),
	color: t.color,
	text: t.string,
	translate: t.boolean,
});
type UpdateData = t.Infer<typeof updateEventType>;

const update = ({ block, color, text }: UpdateData) => {
	block.Part.SurfaceGui.TextLabel.Text = text;
	block.Part.SurfaceGui.TextLabel.TextColor3 = color;
};

const events = {
	update: new BlockSynchronizer("b_screen_update", updateEventType, update),
} as const;

export type { Logic as ScreenBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, ScreenBlock> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const dataToString = (data: BlockLogicTypes.TypeListOfType<typeof definition.input.data.types>): string => {
			if (typeIs(data, "Vector3")) {
				return `${dataToString(data.X)}x\n${dataToString(data.Y)}y\n${dataToString(data.Z)}z`;
			}
			if (typeIs(data, "Color3")) {
				return `${dataToString(data.R)}r\n${dataToString(data.G)}g\n${dataToString(data.B)}b`;
			}
			if (typeIs(data, "number")) {
				const isHighPrecision = data % 0.001 !== 0;
				if (isHighPrecision) {
					return `${Strings.prettyNumber(data, 0.001)}..`;
				}
			}
			if (typeIs(data, "table") && "id" in data) {
				return `Sound ${data.id}\n[${data.effects?.size() ?? 0} effects]`;
			}

			return tostring(data);
		};
		this.on(({ data, textColor }) => {
			events.update.sendOrBurn(
				{
					block: this.instance,
					color: textColor,
					text: dataToString(data),
					translate: typeIs(data, "string"),
				},
				this,
			);
		});
	}
}

export const ScreenBlock = {
	...BlockCreation.defaults,
	id: "screen",
	displayName: "Screen",
	description: "Display all your data for everyone to see!",

	logic: { definition, ctor: Logic, events },
} as const satisfies BlockBuilder;
