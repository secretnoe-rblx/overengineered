import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const defaultParticleID = "14198353638";

namespace ParticleEmitter {
	const definition = {
		input: {
			particle: {
				displayName: "Configured Particle",
				types: {
					particle: {
						config: {
							particleID: defaultParticleID,
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
		properties: t.any.as<BlockLogicTypes.ParticleValue>(),
	});

	const updateStates = ({ properties, block }: UpdateData) => {
		const emitter = block.Body.ParticleEmitter;

		emitter.Texture = `rbxassetid://${properties.particleID}`;
		if (properties.speed) emitter.Speed = new NumberRange(properties.speed);
		if (properties.acceleration) emitter.Acceleration = properties.acceleration;
		if (properties.color) emitter.Color = new ColorSequence(properties.color);
		if (properties.lifetime)
			emitter.Lifetime = new NumberRange(properties.lifetime * 0.95, properties.lifetime * 1.05);
		if (properties.rotation) emitter.Rotation = new NumberRange(properties.rotation);
		if (properties.rotationSpeed) emitter.RotSpeed = new NumberRange(properties.rotationSpeed);
		if (properties.squash) emitter.Squash = new NumberSequence(properties.squash);
		if (properties.transparency) emitter.Transparency = new NumberSequence(properties.transparency);
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
						properties: particle,
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
		inputOrder: [
			"particleID",
			"speed",
			"color",
			"rotation",
			"rotationSpeed",
			"transparency",
			"squash",
			"lifetime",
			"acceleration",
		],
		input: {
			particleID: {
				displayName: "Particle",
				tooltip: "ID of the particle.",
				types: {
					string: { config: defaultParticleID },
				},
			},
			rotation: {
				displayName: "Rotation",
				tooltip: "The rotation offset of the particle",
				...defaultNum,
			},
			rotationSpeed: {
				displayName: "Rotation Speed",
				tooltip: "How fast the particle will rotate",
				...defaultNum,
			},
			transparency: {
				displayName: "Transparency",
				tooltip: "The oposite of opaque-ness",
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
				tooltip: "The color. Speaks for itself.",
				types: { color: { config: Colors.white } },
			},
			squash: {
				displayName: "Squash",
				tooltip: "Flat-ness of the particle",
				...defaultNum,
			},

			lifetime: {
				displayName: "Lifetime",
				tooltip: "How long you'll particle will exist in seconds",
				types: {
					number: {
						config: 0,
					},
				},
			},

			acceleration: {
				displayName: "Acceleration",
				tooltip: "Where will the particle go after being spawned",
				types: {
					vector3: {
						config: Vector3.zero,
					},
				},
			},
			speed: {
				displayName: "Particle speed",
				tooltip: "The speed. Ka-Chau.",
				types: {
					number: {
						config: 2,
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
				for (const [k] of pairs(this.definition.input)) {
					res[k] = arg[k];
				}
				this.output.output.set("particle", res as BlockLogicTypes.ParticleValue);
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
