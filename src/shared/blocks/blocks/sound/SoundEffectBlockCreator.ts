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
			description: "TODO: very long description and important to understand",
		}),
		ezcreate({
			id: "CompressorSoundEffect",
			name: "Compressor",
			description: "TODO: very long description and important to understand",
		}),
		ezcreate({
			id: "DistortionSoundEffect",
			name: "Distortion",
			description: "TODO: very long description and important to understand",
		}),
		ezcreate({
			id: "EchoSoundEffect",
			name: "Echo",
			description: "TODO: very long description and important to understand",
		}),
		ezcreate({
			id: "EqualizerSoundEffect",
			name: "Equalizer",
			description: "TODO: very long description and important to understand",
		}),
		ezcreate({
			id: "FlangeSoundEffect",
			name: "Flange",
			description: "TODO: very long description and important to understand",
		}),
		ezcreate({
			id: "PitchShiftSoundEffect",
			name: "Pitch",
			description: "uh like you can make nightcore or something, or play piano",
		}),
		ezcreate({
			id: "ReverbSoundEffect",
			name: "Reverb",
			description: "TODO: very long description and important to understand",
		}),
		ezcreate({
			id: "TremoloSoundEffect",
			name: "Tremolo",
			description: "TODO: very long description and important to understand",
		}),
	];

	function ezcreate(props: { id: SoundLogic.Instances; name: string; description: string }) {
		const { id, name, description } = props;
		return create(id, {
			displayName: `Sound Effect: ${name}`,
			description,

			modelSource: {
				model: BlockCreation.Model.fAutoCreated("DoubleGenericLogicBlockPrefab", `SOUND ${name.upper()}`),
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
			for (let i = 0; i < str.size(); i++) {
				const char = str.sub(i, i);
				if (i !== 0 && char.upper() === char) {
					ret += ` ${char}`;
				} else {
					ret += char;
				}
			}

			return ret;
		};
		const definition = {
			input: {
				sound: {
					displayName: "Sound",
					types: {
						sound: { config: { id: "" } },
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
