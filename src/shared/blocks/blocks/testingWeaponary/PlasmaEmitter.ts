import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { PlasmaProjectile } from "shared/weapons/PlasmaProjectileLogic";
import { WeaponModule } from "shared/weapons/WeaponModuleSystem";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		fireTrigger: {
			displayName: "Fire",
			types: {
				bool: {
					config: false,
					control: {
						config: {
							enabled: true,
							key: "F",
							switch: false,
							reversed: false,
						},
						canBeReversed: false,
						canBeSwitch: false,
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as PlasmaEmitterBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const module = WeaponModule.allModules[this.instance.Name];
		this.onk(["fireTrigger"], ({ fireTrigger }) => {
			if (!fireTrigger) return;
			const outs = module.parentCollection.calculatedOutputs;
			for (const e of outs) {
				for (const o of e.outputs) {
					const direction = o.markerInstance.Position.sub(e.module.instance.GetPivot().Position);
					PlasmaProjectile.spawn.send({
						startPosition: o.markerInstance.Position.add(direction), //todo replace with block pos of something else
						baseVelocity: direction,
						baseDamage: 0,
						modifier: e.modifier,
					});
				}
			}
		});
	}
}

export const PlasmaEmitterBlock = {
	...BlockCreation.defaults,
	id: "plasmaemitter",
	displayName: "Plasma Emitter",
	description: "",

	weaponConfig: {
		type: "CORE",
		modifier: {
			speedModifier: {
				value: 10,
			},
		},
		markers: {
			marker1: {
				emitsProjectiles: true,
				allowedBlockIds: ["plasmacoilaccelerator"],
				//allowedTypes: ["PROCESSOR"],
			},
		},
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
