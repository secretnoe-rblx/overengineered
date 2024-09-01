import { InstanceBlockLogic as InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { RemoteEvents } from "shared/RemoteEvents";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";

const definition = {
	input: {
		explode: {
			displayName: "Explode",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: true,
							key: "B",
							switch: false,
							reversed: false,
						},
						canBeSwitch: false,
						canBeReversed: false,
					},
				},
			},
		},
		radius: {
			displayName: "Explosion radius",
			types: {
				number: {
					config: 12,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 12,
					},
				},
			},
		},
		pressure: {
			displayName: "Explosion pressure",
			types: {
				number: {
					config: 2500,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 2500,
					},
				},
			},
		},
		flammable: {
			displayName: "Flammable",
			types: {
				bool: {
					config: true,
				},
			},
		},
		impact: {
			displayName: "Impact",
			types: {
				bool: {
					config: true,
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as TNTBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const doExplode = (radius: number, pressure: number, flammable: boolean) => {
			if (!this.instance.PrimaryPart) return;

			RemoteEvents.Explode.send({ part: this.instance.PrimaryPart, radius, pressure, isFlammable: flammable });
			this.disable();
		};

		this.on(({ explode, radius, pressure, flammable }) => {
			if (!explode) return;
			doExplode(radius, pressure, flammable);
		});

		this.event.subscribe(this.instance.PrimaryPart!.Touched, (part) => {
			const ctx = this.cached.tryGetFullInput();
			if (!ctx) return;

			const velocity1 = this.instance.PrimaryPart!.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) {
				doExplode(ctx.radius, ctx.pressure, ctx.flammable);
			}
		});
	}
}

const logic: BlockLogicInfo = { definition, ctor: Logic };
const list = {
	tnt: {
		displayName: "TNT",
		description: "A box of explosives. DO NOT HIT!",
		limit: 100,
		logic,
	},
	cylindricaltnt: {
		displayName: "Cylindrical TNT",
		description: "Not a boxed version",
		limit: 100,
		logic,
	},
	sphericaltnt: {
		displayName: "Spherical TNT",
		description: "Catch this anarchid-man!",
		limit: 100,
		logic,
	},
} satisfies BlockBuildersWithoutIdAndDefaults;
export const TNTBlocks = BlockCreation.arrayFromObject(list);

export type TNTBlockIds = keyof typeof list;
