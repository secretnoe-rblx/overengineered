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

		const doExplode = (part: BasePart, radius: number, pressure: number, flammable: boolean) => {
			if (!part) return;

			RemoteEvents.Explode.send({ part, radius, pressure, isFlammable: flammable });
			this.disable();
		};

		const mainPart = (this.instance.FindFirstChild("Part") ??
			this.instance.FindFirstChild("Union") ??
			this.instance.PrimaryPart!) as BasePart;

		this.on(({ explode, radius, pressure, flammable }) => {
			if (!explode) return;
			doExplode(mainPart, radius, pressure, flammable);
		});

		let radius: number | undefined;
		let pressure: number | undefined;
		let flammable: boolean | undefined;
		this.onk(
			["radius", "pressure", "flammable"],
			(ctx) => ([radius, pressure, flammable] = [ctx.radius, ctx.pressure, ctx.flammable]),
		);

		const impactCache = this.initializeInputCache("impact");

		this.event.subscribe(mainPart.Touched, (part) => {
			if (!impactCache.tryGet()) return;
			if (radius === undefined || pressure === undefined || flammable === undefined) {
				return;
			}
			if (part.CollisionGroup !== "Blocks" && part.CollisionGroup !== "Default") {
				return;
			}

			const velocity1 = mainPart.AssemblyLinearVelocity.Magnitude;
			const velocity2 = part.AssemblyLinearVelocity.Magnitude;

			if (velocity1 > (velocity2 + 1) * 10) {
				doExplode(mainPart, radius, pressure, flammable);
			}
		});
	}
}

const logic: BlockLogicInfo = { definition, ctor: Logic };
const list: BlockBuildersWithoutIdAndDefaults = {
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
		description: "Catch this, anarchid boy!",
		limit: 100,
		logic,
	},
	halfsphericaltnt: {
		displayName: "Half Spherical TNT",
		description: "Had to cut corners. Unfortunately, sphere doesn't have corners.. So we sliced it in half!",
		limit: 100,
		logic,
	},
};
export const TNTBlocks = BlockCreation.arrayFromObject(list);
