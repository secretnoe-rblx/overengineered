import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

namespace ParticleEmitter {
	const definition = {
		input: {
			particle: {
				displayName: "Configured Particle",
				types: {
					particle: {
						config: {
							particleID: "some id",
						},
					},
				},
			},
		},
		output: {},
	} satisfies BlockLogicFullBothDefinitions;

	type particleEmitter = BlockModel & {
		Body: {
			ParticleEmitter: ParticleEmitter;
		};
	};

	type UpdateData = t.Infer<typeof updateDataType>;
	const updateDataType = t.interface({
		block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
		particle: t.any.as<BlockLogicTypes.ParticleValue>(),
	});

	const updateStates = (particle: UpdateData) => {
		const block = particle.block;
		for (const [k, v] of pairs(particle.particle)) {
			// block.Body.ParticleEmitter[k] = v;
		}
	};

	class Logic extends InstanceBlockLogic<typeof definition, particleEmitter> {
		static readonly events = {
			update: new BlockSynchronizer<UpdateData>("particle_update", updateDataType, updateStates),
		} as const;

		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);
			this.onk(["particle"], ({ particle }) =>
				Logic.events.update.sendOrBurn(
					{
						block: this.instance,
						particle,
					},
					this,
				),
			);
			this.onDisable(() => (this.instance.Body.ParticleEmitter.Enabled ??= false));
		}
	}

	export const Block = {
		...BlockCreation.defaults,
		id: "particleemitter",
		displayName: "Particle emitter",
		description: `Spawns various prepared particles.`,

		limit: 20,

		logic: { definition, ctor: Logic },
	} as const satisfies BlockBuilder;
}

namespace ParticleCreator {
	const defaultNum = {
		types: { number: { config: 0 } },
	};

	const definition = {
		input: {
			particleID: {
				displayName: "Particle",
				tooltip: "ID of the particle.",
				types: {
					particle: { config: { particleID: "584691395" } },
				},
			},
			rotation: {
				displayName: "Rotation",
				tooltip: "",
				...defaultNum,
			},
			rotationSpeed: {
				displayName: "Rotation Speed",
				tooltip: "",
				...defaultNum,
			},
			transparency: {
				displayName: "Transparency",
				tooltip: "",
				types: {
					number: {
						config: 0,
						clamp: {
							min: 0,
							max: 1,
							step: 0.01,
							showAsSlider: true,
						},
					},
				},
			},
			color: {
				displayName: "Color",
				tooltip: "",
				types: { color: { config: Colors.white } },
			},
			squash: {
				displayName: "Squash",
				tooltip: "",
				...defaultNum,
			},

			lifetime: {
				displayName: "Squash",
				tooltip: "",
				...defaultNum,
			},

			acceleration: {
				displayName: "Squash",
				tooltip: "",
				types: {
					vector3: {
						config: Vector3.zero,
					},
				},
			},
		},
		output: {
			output: {
				displayName: "Output particle",
				types: ["particle"],
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	class Logic extends InstanceBlockLogic<typeof definition> {
		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			this.on((arg) => {
				const res = {} as Record<string, unknown>;
				for (const [k, v] of pairs(this.definition.input)) {
					res[k] = arg[k];
				}
				this.output.output.set("particle", {
					...arg.particleID,
					...res,
				} as BlockLogicTypes.ParticleValue);
			});
		}
	}

	export const Block = {
		...BlockCreation.defaults,
		id: `particlecreator`,
		displayName: `Particle Creator`,
		description: `Creates the particle. Pass the result of the configuration to ${ParticleEmitter.Block.displayName}!`,

		logic: { definition, ctor: Logic },
	};
}

export const ParticleBlocks: readonly BlockBuilder[] = [ParticleCreator.Block, ParticleEmitter.Block];
