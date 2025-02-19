import { BlockManager } from "shared/building/BlockManager";
import { EffectBase } from "shared/effects/EffectBase";
import type { EffectCreator } from "shared/effects/EffectBase";

type Args = {
	readonly sound: Sound;
	readonly isPlaying: boolean;
	readonly volume: number;
};
@injectable
export class SoundEffect extends EffectBase<Args> {
	constructor(@inject creator: EffectCreator) {
		super(creator, "sound_effect");
	}

	override justRun({ sound, isPlaying, volume }: Args): void {
		if (!sound || !sound.Parent) return;

		const part = sound.Parent;
		if (!BlockManager.isActiveBlockPart(part)) return;

		if (volume > 1) {
			// Probably exploiting
			return;
		}

		sound.Playing = isPlaying;
		sound.Volume = volume;
	}
}
