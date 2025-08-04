import { Debris, ReplicatedStorage } from "@rbxts/services";
import { EffectBase } from "shared/effects/EffectBase";
import type { EffectCreator } from "shared/effects/EffectBase";

ReplicatedStorage.WaitForChild("Assets");

type Args = {
	readonly part: BasePart;
	readonly index?: number;
};
@injectable
export class ExplosionEffect extends EffectBase<Args> {
	readonly soundsFolder = ReplicatedStorage.Assets.Sounds.Explosion.GetChildren();

	constructor(@inject creator: EffectCreator) {
		super(creator, "explosion_effect");
	}

	override justRun({ part, index }: Args): void {
		if (!part) return;

		const soundIndex = index ?? math.random(0, this.soundsFolder.size() - 1);
		const sound = this.soundsFolder[soundIndex].Clone() as Sound;

		sound.Parent = part;
		sound.Play();

		this.playVisualEffect(part);

		Debris.AddItem(sound, sound.TimeLength);
	}

	private playVisualEffect(part: BasePart): void {
		ReplicatedStorage.Assets.Effects.Explosion.GetChildren().forEach((effect) => {
			task.spawn(() => {
				const instance = effect.Clone() as ParticleEmitter;
				instance.Parent = part;
				instance.Enabled = true;
				task.wait(0.1);
				instance.Enabled = false;
			});
		});
	}
}
