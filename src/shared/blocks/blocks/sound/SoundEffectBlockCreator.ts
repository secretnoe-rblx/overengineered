import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { SoundLogic } from "shared/blockLogic/SoundLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

export namespace SoundEffectBlockCreator {
	export const all: readonly BlockBuilder[] = [
		ezcreate({
			id: "ChorusSoundEffect",
			name: "Chorus",
			description: "A chorus sound effect. Speaks for itself, doesn't it?",
		}),
		ezcreate({
			id: "CompressorSoundEffect",
			name: "Compressor",
			description: "A compressor sound effect. Makes higher notes disappear.",
		}),
		ezcreate({
			id: "DistortionSoundEffect",
			name: "Distortion",
			description: "A distortion sound effect. Burns your sounds to a crisp.",
		}),
		ezcreate({
			id: "EchoSoundEffect",
			name: "Echo",
			description: "An echo sound effect. Makes your ears bleed and fall off.",
		}),
		ezcreate({
			id: "EqualizerSoundEffect",
			name: "Equalizer",
			description:
				"An equalizer sound effect. Allows you to adjust the low, middle and high frequencies of the sound.",
		}),
		ezcreate({
			id: "FlangeSoundEffect",
			name: "Flange",
			description: "A flange sound effect. Makes you feel like someone glued the speaker to a spring.",
		}),
		ezcreate({
			id: "PitchShiftSoundEffect",
			name: "Pitch",
			description: "A pitch shift effect. Sometimes makes the music unlistenable.",
		}),
		ezcreate({
			id: "ReverbSoundEffect",
			name: "Reverb",
			description: "A reverberation sound effect. Applies the effect of being in a big room.",
		}),
		ezcreate({
			id: "TremoloSoundEffect",
			name: "Tremolo",
			description: "A tremolo sound effect. Sounds like a reverse sound.",
		}),
	];

	function ezcreate(props: { id: SoundLogic.Instances; name: string; description: string }) {
		const { id, name, description } = props;
		return create(id, {
			displayName: `Sound Effect: ${name}`,
			description,

			modelSource: {
				model: BlockCreation.Model.fAutoCreated("SoundLogicBlockPrefab", `SOUND ${name.upper()}`),
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
