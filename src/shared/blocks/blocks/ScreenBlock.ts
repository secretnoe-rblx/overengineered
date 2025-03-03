import { A2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { Strings } from "engine/shared/fixes/String.propmacro";
import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockConfigDefinitions } from "shared/blocks/BlockConfigDefinitions";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
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

export type { Logic as ScreenBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, ScreenBlock> {
	static readonly events = {
		update: new A2SRemoteEvent<{
			readonly block: ScreenBlock;
			readonly color: Color3;
			readonly text: string;
			readonly translate: boolean;
		}>("b_screen_update"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const dataToString = (data: unknown): string => {
			if (typeIs(data, "Vector3")) {
				return `${dataToString(data.X)}x\n${dataToString(data.Y)}y\n${dataToString(data.Z)}z`;
			}
			if (typeIs(data, "Color3")) {
				return `${dataToString(data.R)}r\n${dataToString(data.G)}g\n${dataToString(data.B)}b`;
			}
			if (typeIs(data, "number")) {
				const isHighPresicion = data % 0.001 !== 0;
				if (isHighPresicion) {
					return `${Strings.prettyNumber(data, 0.001)}..`;
				}
			}

			return tostring(data);
		};
		this.on(({ data, textColor }) => {
			const datastr = dataToString(data);

			if (this.instance.FindFirstChild("Part")) {
				this.instance.Part.SurfaceGui.TextLabel.Text = datastr;
				this.instance.Part.SurfaceGui.TextLabel.TextColor3 = textColor;
			}

			Logic.events.update.send({
				block: this.instance,
				color: textColor,
				text: datastr,
				translate: typeIs(data, "string"),
			});
		});
	}
}

export const ScreenBlock = {
	...BlockCreation.defaults,
	id: "screen",
	displayName: "Screen",
	description: "Display all your data for everyone to see!",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
