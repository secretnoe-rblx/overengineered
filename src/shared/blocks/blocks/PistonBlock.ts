import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { AutoC2SRemoteEvent } from "shared/event/C2SRemoteEvent";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

type Piston = BlockModel & {
	readonly Top: Part & {
		readonly Beam: Beam;
	};
	readonly Bottom: Part & {
		PrismaticConstraint: PrismaticConstraint;
	};
	readonly ColBox: Part;
};

const definition = {
	input: {
		extend: {
			displayName: "Length",
			types: {
				number: {
					config: 0,
					control: {
						defaultType: "smooth",
						min: 0,
						max: 10, // TODO: HIGH LEVEL CRITICAL - THIS IS CONFIGURABLE!!! (from 1 to 10)
						canBeSwitch: true,
						config: {
							type: "smooth",
							add: "R",
							sub: "F",
							speed: 10,
							startValue: 0,
							switchmode: false,
						},
					},
				},
			},
		},
		maxforce: {
			displayName: "Max Force",
			tooltip: "The piston's maximum force as the piston attempts to reach its desired Speed",
			types: {
				number: {
					config: 500,
					clamp: {
						min: 0,
						max: 2000,
						showAsSlider: true,
					},
				},
			},
		},
		speed: {
			displayName: "Speed",
			types: {
				number: {
					config: 5,
					clamp: {
						min: 0,
						max: 20,
						showAsSlider: true,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export { Logic as PistonBlockLogic };
export class Logic extends InstanceBlockLogic<typeof definition, Piston> {
	static readonly events = {
		update: new AutoC2SRemoteEvent<{
			readonly block: BlockModel;
			readonly speed: number;
			readonly position: number;
			readonly force: number;
		}>("piston_update"),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.on((ctx) => {
			this.instance.Bottom.PrismaticConstraint.Speed = ctx.speed;
			this.instance.Bottom.PrismaticConstraint.TargetPosition = ctx.extend;
			this.instance.Bottom.PrismaticConstraint.ServoMaxForce = ctx.maxforce;

			Logic.events.update.send({
				block: this.instance,
				force: ctx.maxforce,
				position: ctx.extend,
				speed: ctx.speed,
			});
		});

		this.onDescendantDestroyed(() => {
			block.instance.FindFirstChild("Top")?.FindFirstChild("Beam")?.Destroy();
			this.disable();
		});
	}
}

export const PistonBlock = {
	...BlockCreation.defaults,
	id: "piston",
	displayName: "Piston",
	description: "No Pi jokes here. It just moves stuff..",
	limit: 100,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
