import { Workspace } from "@rbxts/services";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { BlockManager } from "shared/building/BlockManager";
import { Colors } from "shared/Colors";
import { RobloxUnit } from "shared/RobloxUnit";
import { Sound } from "shared/Sound";
import { VectorUtils } from "shared/utils/VectorUtils";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";
import type { ParticleEffect } from "shared/effects/ParticleEffect";
import type { SoundEffect } from "shared/effects/SoundEffect";

const definition = {
	inputOrder: ["direction", "trailLength", "trailColor"],
	input: {
		direction: {
			displayName: "Direction",
			unit: "Vector3 unit",
			types: {
				vector3: {
					config: Vector3.zero,
				},
			},
		},
		trailLength: {
			displayName: "Trail length",
			types: {
				number: {
					config: 1,
					clamp: {
						showAsSlider: true,
						min: 1,
						max: 5,
					},
				},
			},
		},
		trailColor: {
			displayName: "Trail color",
			types: {
				color: {
					config: Color3.fromRGB(255, 255, 255),
				},
			},
			connectorHidden: true,
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type Emitter = Part & {
	readonly Fire: ParticleEmitter;
};
type Engine = Instance & {
	readonly VectorForce: VectorForce;
	readonly Sound: Sound;
};
type RCSEngineModel = BlockModel & {
	readonly Engine1Emitter: Emitter;
	readonly Engine2Emitter: Emitter;
	readonly Engine3Emitter: Emitter;
	readonly Engine4Emitter: Emitter;
	readonly Engine5Emitter: Emitter;
	readonly Engine1: Engine;
	readonly Engine2: Engine;
	readonly Engine3: Engine;
	readonly Engine4: Engine;
	readonly Engine5: Engine;
	readonly ColBox: Part;
};

type singleEngineConfiguration = {
	readonly engine: Engine;
	readonly particleEmitter: Emitter;
	soundEmitter: Sound;
	vectorForce: VectorForce;
};

export type { Logic as RCSEngineBlockLogic };

@injectable
class Logic extends InstanceBlockLogic<typeof definition, RCSEngineModel> {
	// Instances
	private readonly engineData: readonly singleEngineConfiguration[] = [
		{
			engine: this.instance.Engine1,
			particleEmitter: this.instance.Engine1Emitter,
			soundEmitter: undefined!,
			vectorForce: undefined!,
		},
		{
			engine: this.instance.Engine2,
			particleEmitter: this.instance.Engine2Emitter,
			soundEmitter: undefined!,
			vectorForce: undefined!,
		},
		{
			engine: this.instance.Engine3,
			particleEmitter: this.instance.Engine3Emitter,
			soundEmitter: undefined!,
			vectorForce: undefined!,
		},
		{
			engine: this.instance.Engine4,
			particleEmitter: this.instance.Engine4Emitter,
			soundEmitter: undefined!,
			vectorForce: undefined!,
		},
		{
			engine: this.instance.Engine5,
			particleEmitter: this.instance.Engine5Emitter,
			soundEmitter: undefined!,
			vectorForce: undefined!,
		},
	];

	// Math
	private readonly basePower = RobloxUnit.Newton_To_Rowton(35_000);
	private readonly maxPower;

	// Const
	private readonly maxSoundVolume = 0.5;
	private readonly maxParticlesAcceleration = 120;

	private thrust: Vector3 = Vector3.zero;

	constructor(
		block: InstanceBlockLogicArgs,
		@inject private readonly soundEffect: SoundEffect,
		@inject private readonly particleEffect: ParticleEffect,
	) {
		super(definition, block);

		// Instances
		const colbox = this.instance.ColBox;

		for (const d of this.engineData) {
			d.vectorForce = d.engine.VectorForce;
			d.soundEmitter = d.engine.Sound;
		}

		// Math
		let multiplier = math.round((colbox.Size.X * colbox.Size.Y * colbox.Size.Z) / 16);

		// i dont remember why
		if (multiplier !== 1) multiplier *= 2;

		// The strength depends on the material
		const material = BlockManager.manager.material.get(this.instance);
		multiplier *= math.max(1, math.round(new PhysicalProperties(material).Density / 2));

		// Max power
		this.maxPower = this.basePower * multiplier;
		//this.output.maxpower.set(this.maxPower);

		const setEngineThrust = (engine: singleEngineConfiguration, thrustPercentage: number) => {
			if (!engine.particleEmitter.Fire) return;
			// Force
			engine.vectorForce.Force = new Vector3(RobloxUnit.Newton_To_Rowton(this.maxPower * thrustPercentage));

			// Particles
			const visualize = thrustPercentage !== 0;
			const newParticleEmitterAcceleration = new Vector3(this.maxParticlesAcceleration * thrustPercentage, 0, 0);
			const particleEmmiterHasDifference =
				engine.particleEmitter.Fire.Enabled !== visualize ||
				math.abs(engine.particleEmitter.Fire.Acceleration.X - newParticleEmitterAcceleration.X) > 1;

			engine.particleEmitter.Fire.Enabled = visualize;
			engine.particleEmitter.Fire.Acceleration = new Vector3(
				this.maxParticlesAcceleration * thrustPercentage,
				0,
				0,
			);

			// Sound
			const newVolume =
				Sound.getWorldVolume(this.instance.GetPivot().Y) * (this.maxSoundVolume * math.abs(thrustPercentage));

			const volumeHasDifference =
				visualize !== engine.soundEmitter.Playing || math.abs(engine.soundEmitter.Volume - newVolume) > 0.005;
			engine.soundEmitter.Playing = visualize;
			engine.soundEmitter.Volume = newVolume;

			if (volumeHasDifference) {
				this.soundEffect.send(this.instance.PrimaryPart!, {
					sound: engine.soundEmitter,
					isPlaying: engine.soundEmitter.Playing,
					volume: engine.soundEmitter.Volume / 2,
				});
			}
			if (particleEmmiterHasDifference) {
				const trailColor = this.cached.tryGetInput("trailColor")?.value;

				this.particleEffect.send(this.instance.PrimaryPart!, {
					particle: engine.particleEmitter?.Fire,
					isEnabled: engine.particleEmitter?.Fire.Enabled,
					acceleration: engine.particleEmitter?.Fire.Acceleration,
					color: trailColor ?? Colors.white,
				});
			}
		};

		const update = () => {
			if (!this.isEnabled()) return;
			const thrustPercent = VectorUtils.apply(this.thrust, (v) => math.clamp(v, -100, 100) / 100);
			setEngineThrust(this.engineData[0], -math.max(thrustPercent.Y, 0));

			setEngineThrust(this.engineData[1], -math.abs(math.max(thrustPercent.X, 0)));
			setEngineThrust(this.engineData[2], -math.abs(math.min(thrustPercent.X, 0)));

			setEngineThrust(this.engineData[4], -math.abs(math.max(thrustPercent.Z, 0)));
			setEngineThrust(this.engineData[3], -math.abs(math.min(thrustPercent.Z, 0)));
		};

		this.event.subscribe(Workspace.GetPropertyChangedSignal("Gravity"), update);
		this.onk(["direction"], ({ direction }) => {
			this.thrust = direction;
			update();
		});

		this.onk(["trailLength"], ({ trailLength }) => {
			const val = new NumberRange(trailLength * 0.15);
			for (const engine of this.engineData) {
				engine.particleEmitter.Fire.Lifetime = val;
			}
		});

		this.onk(["trailColor"], ({ trailColor }) => {
			const val = new ColorSequence(trailColor);
			for (const engine of this.engineData) {
				engine.particleEmitter.Fire.Color = val;
			}
		});

		this.onDescendantDestroyed(() => {
			update();
			this.disable();
		});
	}
}

export const RCSEngineBlock = {
	...BlockCreation.defaults,
	id: "rcsengine",
	displayName: "RCS Engine",
	description: "Support engines used to orient a spacecraft",
	limit: 50,
	mirror: {
		behaviour: "offset180",
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
