import { TweenService } from "@rbxts/services";

export class MusicPlaylist {
	readonly sounds: { originalVolume: number; sound: Sound }[];
	private readonly interval: number;

	currentSound: Sound | undefined;
	private currentSoundEndEvent: RBXScriptConnection | undefined;

	constructor(sounds: Sound[], interval: number) {
		this.sounds = sounds.map((v) => ({ originalVolume: v.Volume, sound: v }));
		this.interval = interval;
	}

	playSpecificByName(name: string) {
		this.currentSound = this.sounds.find((v) => v.sound.Name === name)?.sound;
		if (!this.currentSound) throw `No music with the name "${name}" was found`;
		this.currentSound.Play();
	}

	setVolume(volume: number) {
		for (const v of this.sounds) {
			v.sound.Volume = v.originalVolume * volume;
		}
	}

	play() {
		if (this.sounds.isEmpty()) return;
		this.currentSound = this.sounds[math.random(0, this.sounds.size() - 1)]?.sound;
		this.currentSoundEndEvent = this.currentSound.Ended.Once(() => {
			wait(this.interval);
			this.play();
		});
		this.currentSound.Play();
	}

	stop() {
		this.currentSoundEndEvent?.Disconnect();

		if (this.currentSound) {
			const tween = TweenService.Create(this.currentSound, new TweenInfo(2), { Volume: 0 });

			tween.Play();
			tween.Completed.Connect(this.currentSound?.Stop);
		}
		this.currentSound = undefined;
	}
}
