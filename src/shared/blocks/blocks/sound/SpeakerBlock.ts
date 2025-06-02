import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { SoundLogic } from "shared/blockLogic/SoundLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["sound", "play", "volume", "loop"],
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

class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const soundInstance = new Instance("Sound", this.instance.PrimaryPart);
		let nextSoundUpdate: BlockLogicTypes.SoundValue | undefined;

		const updateVolume = (volume: number) => {
			soundInstance.Volume = volume;
			soundInstance.RollOffMaxDistance = 10_000 * volume;
		};
		const updateLoop = (loop: boolean) => (soundInstance.Looped = loop);
		const volumeCache = this.initializeInputCache("volume");
		const loopCache = this.initializeInputCache("loop");

		this.onk(["sound"], ({ sound }) => {
			if (!soundInstance.IsPlaying) {
				nextSoundUpdate = sound;
				return;
			}

			updateSound(soundInstance, sound);
		});

		this.onk(["volume"], ({ volume }) => updateVolume(volume));
		this.onk(["loop"], ({ loop }) => updateLoop(loop));
		this.onk(["play"], ({ play }) => {
			if (!play) {
				updateLoop(false);
				return;
			}

			if (nextSoundUpdate) {
				updateSound(soundInstance, nextSoundUpdate);
				nextSoundUpdate = undefined;

				soundInstance.Parent = this.instance!.PrimaryPart!;
				soundInstance.Played.Connect(() => this.output.isPlaying.set("bool", true));
				soundInstance.Ended.Connect(() => this.output.isPlaying.set("bool", false));
				updateVolume(volumeCache.tryGet() ?? 1);
			}

			updateLoop(loopCache.tryGet() ?? false);
			soundInstance.Play();
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
		partialAliases: ["sound"],
	},

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
