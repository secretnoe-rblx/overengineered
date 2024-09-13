import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { RobloxUnit } from "shared/RobloxUnit";
import { Sound } from "shared/Sound";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuildersWithoutIdAndDefaults, BlockLogicInfo } from "shared/blocks/Block";
import type { ParticleEffect } from "shared/effects/ParticleEffect";
import type { SoundEffect } from "shared/effects/SoundEffect";

const definition = {
	inputOrder: ["thrust", "strength"],
	input: {
		thrust: {
			displayName: "Thrust",
			unit: "Percentage",
			types: {
				number: {
					config: 0,
					clamp: {
						showAsSlider: false,
						min: 0,
						max: 100,
					},
					control: {
						config: {
							enabled: true,
							startValue: 0,
							mode: {
								stopOnRelease: true,
								resetOnStop: false,
								smooth: true,
								smoothSpeed: 20,
							},
							keys: [
								{ key: "W", value: 100 },
								{ key: "S", value: 0 },
							],
						},
					},
				},
			},
		},
		strength: {
			displayName: "Strength",
			unit: "Percentage",
			types: {
				number: {
					config: 100,
					clamp: {
						showAsSlider: true,
						max: 100,
						min: 0,
					},
				},
			},
		},
	},
	output: {
		maxpower: {
			displayName: "Force",
			unit: "Newton",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

type RocketModel = BlockModel & {
	readonly EffectEmitter: Part & {
		readonly Fire: ParticleEmitter;
	};
	readonly Engine: Instance & {
		readonly VectorForce: VectorForce;
		readonly Sound: Sound;
	};
	readonly ColBox: Part;
};

export type { Logic as RocketBlockLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, RocketModel> {
	// Instances
	private readonly engine;
	private readonly vectorForce;
	private readonly particleEmitter;
	private readonly sound;

	// Math
	private readonly basePower = RobloxUnit.Newton_To_Rowton(1_100_000);
	private readonly maxPower;

	// Const
	private readonly maxSoundVolume = 0.5;
	private readonly maxParticlesAcceleration = 120;

	private cachedThrust = 0;

	constructor(
		block: InstanceBlockLogicArgs,
		@inject private readonly soundEffect: SoundEffect,
		@inject private readonly particleEffect: ParticleEffect,
	) {
		super(definition, block);

		// Instances
		const colbox = this.instance.ColBox;
		this.engine = this.instance.Engine;
		this.vectorForce = this.engine.VectorForce;
		this.sound = this.engine.Sound;
		this.particleEmitter = this.instance.EffectEmitter.Fire;

		// Math
		let multiplier = math.round((colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16);

		// i dont remember why
		if (multiplier !== 1) {
			multiplier *= 2;
		}

		// The strength depends on the material
		const material = BlockManager.manager.material.get(this.instance);
		multiplier *= math.max(1, math.round(new PhysicalProperties(material).Density / 2));

		// Max power
		this.maxPower = this.basePower * multiplier;
		this.output.maxpower.set("number", this.maxPower);

		this.onAlwaysInputs(({ thrust, strength }) => {
			this.cachedThrust = thrust;
			this.update(thrust, strength);
		});

		this.onDescendantDestroyed(() => {
			this.update(0, 0);
			this.disable();
		});
	}

	private update(thrust: number, strength: number) {
		const thrustPercent = thrust / 100;
		const strengthPercent = strength / 100;

		// Force
		this.vectorForce.Force = new Vector3(
			RobloxUnit.Newton_To_Rowton(this.maxPower * thrustPercent * strengthPercent),
		);

		// Particles
		const visualize = thrustPercent !== 0;
		const newParticleEmitterAcceleration = new Vector3(
			this.maxParticlesAcceleration * thrustPercent * strengthPercent,
			0,
			0,
		);
		const particleEmmiterHasDifference =
			this.particleEmitter.Enabled !== visualize ||
			math.abs(this.particleEmitter.Acceleration.X - newParticleEmitterAcceleration.X) > 1;

		this.particleEmitter.Enabled = visualize;
		this.particleEmitter.Acceleration = new Vector3(
			this.maxParticlesAcceleration * thrustPercent * strengthPercent,
			0,
			0,
		);

		// Sound
		const newVolume =
			Sound.getWorldVolume(this.instance.GetPivot().Y) * (this.maxSoundVolume * thrustPercent * strengthPercent);

		const volumeHasDifference = visualize !== this.sound.Playing || math.abs(this.sound.Volume - newVolume) > 0.005;
		this.sound.Playing = visualize;
		this.sound.Volume = newVolume;

		if (volumeHasDifference) {
			this.soundEffect.send(this.instance.PrimaryPart!, {
				sound: this.sound,
				isPlaying: this.sound.Playing,
				volume: this.sound.Volume,
			});
		}
		if (particleEmmiterHasDifference) {
			this.particleEffect.send(this.instance.PrimaryPart!, {
				particle: this.particleEmitter,
				isEnabled: this.particleEmitter.Enabled,
				acceleration: this.particleEmitter.Acceleration,
			});
		}
	}

	getThrust() {
		return this.cachedThrust;
	}
}

const logic: BlockLogicInfo = { definition, ctor: Logic };
const list = {
	rocketengine: {
		displayName: "Rocket Engine",
		description: "Engines your rocket into the space and onto the ground",
		logic,
		limit: 50,
	},
	smallrocketengine: {
		displayName: "Small Rocket Engine",
		description: "Engines your rocket into the space and onto the ground",
		logic,
		limit: 50,
	},
} satisfies BlockBuildersWithoutIdAndDefaults;
export const RocketBlocks = BlockCreation.arrayFromObject(list);

export type RocketBlockIds = keyof typeof list;
