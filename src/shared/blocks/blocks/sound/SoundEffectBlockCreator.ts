import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { SoundLogic } from "shared/blockLogic/SoundLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

export namespace SoundEffectBlockCreator {
	namespace SpeedEffect {
		const definition = {
			input: {
				sound: {
					displayName: "Sound",
					types: {
						sound: { config: { id: "584691395" } },
					},
				},
				speed: {
					displayName: "Speed",
					tooltip: "Playback speed. Also changes pitch",
					types: {
						number: { config: 1 },
					},
				},
			},
			output: {
				output: {
					displayName: "Output sound",
					types: ["sound"],
				},
			},
		} satisfies BlockLogicFullBothDefinitions;

		class Logic extends InstanceBlockLogic<typeof definition> {
			constructor(block: InstanceBlockLogicArgs) {
				super(definition, block);

				this.onk(["sound", "speed"], (arg) => {
					this.output.output.set("sound", {
						...arg.sound,
						speed: arg.speed,
					});
				});
			}
		}

		export const Block = {
			...BlockCreation.defaults,
			displayName: `Sound Effect: Speed`,
			description: "Changes the playback speed of the sound, along with its pitch",

			modelSource: {
				model: BlockCreation.Model.fAutoCreated("SoundLogicBlockPrefab", `SOUND SPEED`),
				category: () => BlockCreation.Categories.sound,
			},
			id: `soundeff_speed`,

			logic: { definition, ctor: Logic },
		};
	}
	namespace SoundCutEffect {
		const definition = {
			input: {
				sound: {
					displayName: "Sound",
					types: {
						sound: { config: { id: "584691395" } },
					},
				},
				start: {
					displayName: "Start",
					unit: "seconds",
					types: {
						number: { config: 0 },
					},
				},
				length: {
					displayName: "Length",
					unit: "seconds",
					types: {
						number: { config: 1 },
					},
				},
			},
			output: {
				output: {
					displayName: "Output sound",
					types: ["sound"],
				},
			},
		} satisfies BlockLogicFullBothDefinitions;

		class Logic extends InstanceBlockLogic<typeof definition> {
			constructor(block: InstanceBlockLogicArgs) {
				super(definition, block);

				this.onk(["sound", "start", "length"], (arg) => {
					this.output.output.set("sound", {
						...arg.sound,
						start: arg.start,
						length: arg.length,
					});
				});
			}
		}

		export const Block = {
			...BlockCreation.defaults,
			displayName: `Sound Cut`,
			description: "Cuts the sound",

			modelSource: {
				model: BlockCreation.Model.fAutoCreated("SoundLogicBlockPrefab", `SOUND CUT`),
				category: () => BlockCreation.Categories.sound,
			},
			id: `soundeff_cut`,

			logic: { definition, ctor: Logic },
		};
	}

	export const all: readonly BlockBuilder[] = [
		SpeedEffect.Block,
		SoundCutEffect.Block,
		ezcreate({
			id: "ChorusSoundEffect",
			name: "Chorus",
			description: "A chorus sound effect. Speaks for itself, doesn't it?",
			modelText: "CHORUS",
		}),
		ezcreate({
			id: "CompressorSoundEffect",
			name: "Compressor",
			description: "A compressor sound effect. Makes higher notes disappear.",
			modelText: "COMPR",
		}),
		ezcreate({
			id: "DistortionSoundEffect",
			name: "Distortion",
			description: "A distortion sound effect. Burns your sounds to a crisp.",
			modelText: "DISTORT",
		}),
		ezcreate({
			id: "EchoSoundEffect",
			name: "Echo",
			description: "An echo sound effect. Makes your ears bleed and fall off.",
			modelText: "ECHO",
		}),
		ezcreate({
			id: "EqualizerSoundEffect",
			name: "Equalizer",
			description:
				"An equalizer sound effect. Allows you to adjust the low, middle and high frequencies of the sound.",
			modelText: "EQ",
		}),
		ezcreate({
			id: "FlangeSoundEffect",
			name: "Flange",
			description: "A flange sound effect. Makes you feel like someone glued the speaker to a spring.",
			modelText: "FLANGE",
		}),
		ezcreate({
			id: "PitchShiftSoundEffect",
			name: "Pitch",
			description: "A pitch shift effect. Sometimes makes the music unlistenable.",
			modelText: "PITCH",
		}),
		ezcreate({
			id: "ReverbSoundEffect",
			name: "Reverb",
			description: "A reverberation sound effect. Applies the effect of being in a big room.",
			modelText: "REVERB",
		}),
		ezcreate({
			id: "TremoloSoundEffect",
			name: "Tremolo",
			description: "A tremolo sound effect. Sounds like a reverse sound.",
			modelText: "TREM",
		}),
	];

	function ezcreate(props: { id: SoundLogic.Instances; name: string; description: string; modelText: string }) {
		const { id, name, description } = props;
		return create(id, {
			displayName: `Sound Effect: ${name}`,
			description,

			modelSource: {
				model: BlockCreation.Model.fAutoCreated("SoundLogicBlockPrefab", `SOUND ${props.modelText}`),
				category: () => BlockCreation.Categories.sound,
			},
		});
	}

	function create(
		key: SoundLogic.Instances,
		props: MakeRequired<Partial<BlockBuilder>, "displayName" | "description">,
	): BlockBuilder {
		const maker = SoundLogic.effectMaker(key);
		const keys = asMap(maker.props as { [k in string]: unknown }).keys();

		const pascalCaseToName = (str: string) => {
			let ret = "";
			for (let i = 1; i <= str.size(); i++) {
				const char = str.sub(i, i);
				if (i !== 1 && char.upper() === char) {
					ret += ` ${char}`;
					continue;
				}
				ret += char;
			}

			return ret;
		};

		const definition = {
			input: {
				sound: {
					displayName: "Sound",
					types: {
						sound: { config: { id: "584691395" } },
					},
				},
				...asObject(keys.mapToMap((k) => $tuple(k.lower(), maker.makeConfig(k as never, pascalCaseToName(k))))),
			},
			output: {
				output: {
					displayName: "Output sound",
					types: ["sound"],
				},
			},
		} satisfies BlockLogicFullBothDefinitions;

		class Logic extends InstanceBlockLogic<typeof definition> {
			constructor(block: InstanceBlockLogicArgs) {
				super(definition, block);

				this.onk(["sound", ...(keys.map((c) => c.lower()) as never)], (arg) => {
					this.output.output.set("sound", {
						...arg.sound,
						effects: [
							...(arg.sound.effects ?? []),
							{
								type: key,
								properties: asObject(keys.mapToMap((k) => $tuple(k, arg[k.lower() as never]))),
							},
						],
					});
				});
			}
		}

		return {
			...BlockCreation.defaults,
			...props,
			id: `soundeff_${key}`,

			logic: { definition, ctor: Logic },
		};
	}
}
