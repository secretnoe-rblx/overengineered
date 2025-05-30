import { t } from "engine/shared/t";
import type { BlockLogicFullInputDef } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

export namespace SoundLogic {
	export type Instances = keyof CreatableInstances & `${string}SoundEffect`;
	function newEffect<T extends Instances>(
		id: T,
		properties: {
			readonly [k in Exclude<ExtractKeys<CreatableInstances[T], number>, "Priority">]: t.Type<
				number,
				{ min: number; max: number }
			>;
		},
	) {
		return t.interface({ type: t.const(id), properties: t.interface(properties) });
	}

	export const effects = {
		ChorusSoundEffect: newEffect("ChorusSoundEffect", {
			Depth: t.numberWithBounds(0, 1),
			Mix: t.numberWithBounds(0, 1),
			Rate: t.numberWithBounds(0, 20),
		}),
		CompressorSoundEffect: newEffect("CompressorSoundEffect", {
			Attack: t.numberWithBounds(0, 1),
			GainMakeup: t.numberWithBounds(0, 30),
			Ratio: t.numberWithBounds(1, 50),
			Release: t.numberWithBounds(0.001, 5),
			// SideChain
			Threshold: t.numberWithBounds(-80, 0),
		}),
		DistortionSoundEffect: newEffect("DistortionSoundEffect", {
			Level: t.numberWithBounds(0, 1),
		}),
		EchoSoundEffect: newEffect("EchoSoundEffect", {
			Delay: t.numberWithBounds(0.1, 5),
			DryLevel: t.numberWithBounds(-80, 10),
			Feedback: t.numberWithBounds(0, 1),
			WetLevel: t.numberWithBounds(-80, 10),
		}),
		EqualizerSoundEffect: newEffect("EqualizerSoundEffect", {
			HighGain: t.numberWithBounds(-80, 10),
			LowGain: t.numberWithBounds(-80, 10),
			MidGain: t.numberWithBounds(-80, 10),
		}),
		FlangeSoundEffect: newEffect("FlangeSoundEffect", {
			Depth: t.numberWithBounds(0.01, 1),
			Mix: t.numberWithBounds(0, 1),
			Rate: t.numberWithBounds(0, 20),
		}),
		PitchShiftSoundEffect: newEffect("PitchShiftSoundEffect", {
			Octave: t.numberWithBounds(0.5, 2),
		}),
		ReverbSoundEffect: newEffect("ReverbSoundEffect", {
			DecayTime: t.numberWithBounds(0.1, 20),
			Density: t.numberWithBounds(0, 1),
			Diffusion: t.numberWithBounds(0, 1),
			DryLevel: t.numberWithBounds(-80, 20),
			WetLevel: t.numberWithBounds(-80, 20),
		}),
		TremoloSoundEffect: newEffect("TremoloSoundEffect", {
			Depth: t.numberWithBounds(0, 1),
			Duty: t.numberWithBounds(0, 1),
			Frequency: t.numberWithBounds(0.1, 20),
		}),
	} as const;

	export function effectMaker<IK extends keyof typeof effects>(key: IK) {
		const effect = effects[key];
		const def = new Instance(key);

		return {
			props: effect.props.properties.props,
			makeConfig: <PK extends keyof (typeof effects)[IK]["props"]["properties"]["props"]>(
				key: PK,
				displayName?: string,
			) => {
				const props = (
					effect.props.properties.props[key as never] as t.Type<number, { min: number; max: number }>
				).props;

				return {
					displayName: displayName ?? tostring(key),
					types: {
						number: {
							config: def[key as never] as number,
							clamp: {
								showAsSlider: true,
								min: props.min,
								max: props.max,
							},
						},
					},
				} satisfies BlockLogicFullInputDef;
			},
		};
	}

	export function typeCheck(effect: BlockLogicTypes.SoundEffect<SoundLogic.Instances>): boolean {
		type untyped = t.Type<{
			readonly type: Instances;
			readonly properties: { readonly [k in string]: number };
		}>;

		const efftype: untyped = SoundLogic.effects[effect.type];
		return t.typeCheck(effect, efftype);
	}

	export const basic = {
		pianoNote: "584691395",
		drumHigh: "7611824097",
		drumSnare: "18623982413",
		drumKick: "137721550021975",
		drumBass: "1842312348",
	} as const;
}
