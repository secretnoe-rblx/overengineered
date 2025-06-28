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
				displayName: "Configured particle",
				types: {
					particle: {
						config: {
							particleID: "some id",
						},
					},
				},
			},
			enabled: {
				displayName: "Enabled",
				types: {
					bool: {
						config: true,
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
		enabled: t.boolean,
	});

	const updateStates = ({ properties, block, enabled }: UpdateData) => {
		const emitter = block.Body.ParticleEmitter;

		emitter.Enabled = enabled;
		emitter.Texture = `rbxassetid://${properties.particleID}`;
		if (properties.flipbookLayout)
			emitter.FlipbookLayout = Enum.ParticleFlipbookLayout[properties.flipbookLayout as never];
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
			this.on(({ particle, enabled }) =>
				Logic.events.update.sendOrBurn(
					{
						block: this.instance,
						properties: particle,
						enabled,
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
			"rate",
			"rotation",
			"rotationSpeed",
			"transparency",
			"squash",
			"lifetime",
			"acceleration",
			"flipbookLayout",
		],
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
			speed: {
				displayName: "Particle speed",
				tooltip: "The speed. Ka-Chau.",
				types: {
					number: {
						config: 2,
					},
				},
			},

			flipbookLayout: {
				displayName: "Flipbook layout",
				tooltip: "idk ask the internet",
				types: {
					enum: {
						config: "None",
						elements: {
							None: { displayName: "None" },
							Grid2x2: { displayName: "Grid 2x2" },
							Grid4x4: { displayName: "Grid 4x4" },
							Grid8x8: { displayName: "Grid 8x8" },
						},
						elementOrder: ["None", "Grid2x2", "Grid4x4", "Grid8x8"],
					},
				},
			},
			rate: {
				displayName: "Spawn rate",
				tooltip: "How often the particles will spawn",
				types: {
					number: {
						config: 5,
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
