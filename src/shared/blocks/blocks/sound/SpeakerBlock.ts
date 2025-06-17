import { Objects } from "engine/shared/fixes/Objects";
import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { SoundLogic } from "shared/blockLogic/SoundLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["sound", "play", "volume", "loop"],
	outputOrder: ["isPlaying", "progress"],
	input: {
		sound: {
			displayName: "Sound",
			types: {
				sound: {
					config: { id: "584691395" },
				},
			},
		},
		play: {
			displayName: "Play",
			types: {
				bool: { config: false },
			},
		},
		volume: {
			displayName: "Volume",
			types: {
				number: {
					config: 1,
					clamp: {
						showAsSlider: true,
						min: 0,
						max: 10,
					},
				},
			},
		},
		loop: {
			displayName: "Loop",
			tooltip: "Whether to loop the sound while Play input is true",
			types: {
				bool: { config: false },
			},
		},
	},
	output: {
		isPlaying: {
			displayName: "Is playing",
			types: ["bool"],
		},
		progress: {
			displayName: "Progress",
			unit: "seconds",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

const updateSound = (instance: Sound, sound: BlockLogicTypes.SoundValue) => {
	if (!sound.id || sound.id.size() === 0) {
		instance.SoundId = "";
		return;
	}

	if (sound.effects) {
		for (const effect of sound.effects) {
			if (!SoundLogic.typeCheck(effect)) {
				instance.SoundId = "";
				return;
			}
		}
	}

	instance.SoundId = `rbxassetid://${sound.id}`;
	instance.PlaybackSpeed = sound.speed ?? 1;
	instance.PlaybackRegionsEnabled = sound.start !== undefined || sound.length !== undefined;
	if (instance.PlaybackRegionsEnabled) {
		instance.PlaybackRegion = new NumberRange(sound.start ?? 0, (sound.start ?? 0) + (sound.length ?? 999));
	}

	if (!sound.effects || sound.effects.size() === 0) {
		instance.ClearAllChildren();
	} else {
		const existingEffects = instance.GetChildren().toSet();

		let idx = 0;
		for (const effect of sound.effects) {
			let effinstance = existingEffects.find((c) => c.ClassName === effect.type) as SoundEffect | undefined;
			if (effinstance) {
				existingEffects.delete(effinstance);
			} else {
				effinstance = new Instance(effect.type, instance);
			}

			for (const [k, v] of pairs(effect.properties)) {
				effinstance[k as "Priority"] = v as number;
			}

			effinstance.Priority = --idx;
		}

		for (const child of existingEffects) {
			child.Destroy();
		}
	}
};

const tSound = t.intersection(
	t.interface({
		id: t.string,
	}),
	t.partial({
		effects: t.array(t.union(...Objects.values(SoundLogic.effects))),
		speed: t.number,
		start: t.number,
		length: t.number,
	}),
) satisfies t.Type<BlockLogicTypes.SoundValue>;

const updateType = t.intersection(
	t.interface({
		block: t.instance("Model").nominal("blockModel"),
		play: t.boolean,
		sound: tSound.orUndefined(),
	}),
	t.partial({
		progress: t.number,
		volume: t.numberWithBounds(0, 10),
		loop: t.boolean,
	}),
);
type UpdateType = t.Infer<typeof updateType>;

const remoteUpdate = (arg: UpdateType) => {
	const sound = arg.block.PrimaryPart?.FindFirstChildOfClass("Sound") ?? new Instance("Sound", arg.block.PrimaryPart);

	if (arg.volume) S.updateVolume(sound, arg.volume);
	if (arg.loop) S.updateLoop(sound, arg.loop);
	if (arg.sound) updateSound(sound, arg.sound);

	if (arg.play) sound.Play();
};

namespace S {
	export function updateVolume(sound: Sound, volume: number) {
		sound.Volume = volume;
		sound.RollOffMaxDistance = 10_000 * volume;
	}
	export function updateLoop(sound: Sound, loop: boolean) {
		sound.Looped = loop;
	}
}

const propsOfSound = (sound: Sound) => {
	if (!sound.Playing) {
		return { play: false };
	}

	return {
		play: sound.Playing,
		progress: sound.TimePosition,
		volume: sound.Volume,
		loop: sound.Looped,
	};
};

const events = {
	update: new BlockSynchronizer("b_speaker_update", updateType, remoteUpdate),
};
events.update.getExisting = (stored) => {
	const sound = stored.block.PrimaryPart?.FindFirstChildOfClass("Sound");
	if (!sound) return stored;

	return { ...stored, ...propsOfSound(sound) };
};

class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const sendUpdate = (sound?: BlockLogicTypes.SoundValue) => {
			events.update.send({
				block: block.instance,
				sound: sound as never,
				...propsOfSound(soundInstance),
			});
		};

		const soundInstance = new Instance("Sound", this.instance.PrimaryPart);
		let nextSoundUpdate: BlockLogicTypes.SoundValue | undefined;

		const updateVolume = (volume: number) => S.updateVolume(soundInstance, volume);
		const updateLoop = (loop: boolean) => S.updateLoop(soundInstance, loop);
		// const volumeCache = this.initializeInputCache("volume");
		// const loopCache = this.initializeInputCache("loop");

		this.onk(["sound"], ({ sound }) => {
			if (!soundInstance.IsPlaying) {
				nextSoundUpdate = sound;
				return;
			}

			updateSound(soundInstance, sound);
			sendUpdate();
		});

		this.onk(["volume"], ({ volume }) => {
			updateVolume(volume);

			if (soundInstance.Playing) {
				sendUpdate();
			}
		});
		this.onk(["loop"], ({ loop }) => {
			updateLoop(loop);

			if (soundInstance.Playing) {
				sendUpdate();
			}
		});
		this.onk(["play"], ({ play }) => {
			if (!play) {
				updateLoop(false);
				sendUpdate();
				return;
			}

			const update = nextSoundUpdate;

			if (nextSoundUpdate) {
				updateSound(soundInstance, nextSoundUpdate);
				nextSoundUpdate = undefined;

				soundInstance.Parent = this.instance!.PrimaryPart!;
				soundInstance.Played.Connect(() => this.output.isPlaying.set("bool", true));
				soundInstance.Ended.Connect(() => this.output.isPlaying.set("bool", false));
				// updateVolume(volumeCache.tryGet() ?? 1);
			}

			// updateLoop(loopCache.tryGet() ?? false);
			soundInstance.Play();
			sendUpdate(update);
		});

		this.event.loop(0, () => {
			this.output.progress.set("number", soundInstance?.TimePosition ?? 0);
		});
	}
}

export const SpeakerBlock = {
	...BlockCreation.defaults,
	id: "speaker",
	displayName: "Speaker",
	description: "Definitely speaks something, but only to you. Schizofrenia?",
	limit: 50,
	search: {
		partialAliases: ["sound", "music", "speaker", "play"],
	},

	logic: { definition, ctor: Logic, events },
} as const satisfies BlockBuilder;
