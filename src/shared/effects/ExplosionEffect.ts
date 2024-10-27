import { Debris, ReplicatedStorage, Workspace } from "@rbxts/services";
import { EffectBase } from "shared/effects/EffectBase";

ReplicatedStorage.WaitForChild("Assets");

type Args = {
	readonly part: BasePart;
	readonly index?: number;
};
export class ExplosionEffect extends EffectBase<Args> {
	readonly soundsFolder = ReplicatedStorage.Assets.Effects.Sounds.Explosion.GetChildren();

	constructor() {
		super("explosion_effect");
	}

	justRun({ part, index }: Args): number {
		const soundIndex = index ?? math.random(0, this.soundsFolder.size() - 1);
		const sound = this.soundsFolder[soundIndex].Clone() as Sound;

		const partClone = part.Clone();
		partClone.ClearAllChildren();
		partClone.Transparency = 1;
		partClone.Parent = Workspace;

		sound.Parent = partClone;
		sound.Play();
		this.playVisualEffect(partClone);
		Debris.AddItem(partClone, sound.TimeLength);

		return soundIndex;
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
