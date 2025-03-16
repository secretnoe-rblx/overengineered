import { BlockManager } from "shared/building/BlockManager";
import { EffectBase } from "shared/effects/EffectBase";
import type { EffectCreator } from "shared/effects/EffectBase";

type Args = {
	readonly particle: ParticleEmitter;
	readonly isEnabled: boolean;
	readonly acceleration: Vector3;
	readonly scale?: number;
	readonly color?: Color3;
};
@injectable
export class ParticleEffect extends EffectBase<Args> {
	constructor(@inject creator: EffectCreator) {
		super(creator, "particle_effect");
	}

	override justRun({ particle, isEnabled, acceleration, color, scale }: Args): void {
		if (!particle || !particle.Parent) return;

		const part = particle.Parent;
		if (!BlockManager.isActiveBlockPart(part)) return;

		if (scale) {
			particle.Size = new NumberSequence(
				particle.Size.Keypoints.map((k) => new NumberSequenceKeypoint(k.Time, k.Value * scale, k.Envelope)),
			);
		}

		particle.Enabled = isEnabled;
		particle.Acceleration = acceleration;
		if (color) particle.Color = new ColorSequence(color);
	}
}
