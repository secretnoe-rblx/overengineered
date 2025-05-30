import { Element } from "engine/shared/Element";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { SoundLogic } from "shared/blockLogic/SoundLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	inputOrder: ["sound", "play", "volume"],
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
	},
	output: {
		isPlaying: {
			displayName: "Is playing",
			types: ["bool"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

const createSound = (sound: BlockLogicTypes.SoundValue): Sound | undefined => {
	if (!sound.id || sound.id.size() === 0) {
		return;
	}

	if (sound.effects) {
		for (const effect of sound.effects) {
			if (!SoundLogic.typeCheck(effect)) {
				return;
			}
		}
	}

	const instance = Element.create("Sound", {
		SoundId: `rbxassetid://${sound.id}`,
	});
	if (sound.effects) {
		let idx = 0;
		for (const effect of sound.effects) {
			const effinstance = Element.create(effect.type, effect.properties);
			effinstance.Priority = --idx;
			effinstance.Parent = instance;
		}
	}

	return instance;
};

class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		let currentSound: Sound | undefined;
		let nextSoundUpdate: BlockLogicTypes.SoundValue | undefined;

		const updateVolume = (volume: number) => {
			if (!currentSound) return;
			currentSound.Volume = volume;
			currentSound.RollOffMaxDistance = 10_000 * volume;
		};
		const volumeCache = this.initializeInputCache("volume");

		this.onk(["sound"], ({ sound }) => (nextSoundUpdate = sound));

		this.onk(["volume"], ({ volume }) => updateVolume(volume));
		this.onk(["play"], ({ play }) => {
			if (!play) return;

			if (nextSoundUpdate) {
				currentSound?.Destroy();
				currentSound = createSound(nextSoundUpdate);
				nextSoundUpdate = undefined;
				if (!currentSound) return;

				currentSound.Parent = this.instance!.PrimaryPart!;
				currentSound.Played.Connect(() => this.output.isPlaying.set("bool", true));
				currentSound.Ended.Connect(() => this.output.isPlaying.set("bool", false));
				updateVolume(volumeCache.tryGet() ?? 1);
			}

			currentSound?.Play();
		});
	}
}

export const SpeakerBlock = {
	...BlockCreation.defaults,
	id: "speaker",
	displayName: "Speaker",
	description: "Definitely speaks something, but only to you. Schizofrenia?",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
