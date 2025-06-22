import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

namespace SpeedEffect {
	const definition = {
		input: {
			particle: {
				displayName: "Particle",
				tooltip: "ID of the particle.",
				types: {
					particle: { config: { id: "584691395" } },
				},
			},
			speed: {
				displayName: "Speed",
				tooltip: "How fast the particle moves.",
				types: {
					number: { config: 1 },
				},
			},
		},
		output: {
			output: {
				displayName: "Output particle",
				types: ["particle"],
			},
		},
	} satisfies BlockLogicFullBothDefinitions;

	class Logic extends InstanceBlockLogic<typeof definition> {
		constructor(block: InstanceBlockLogicArgs) {
			super(definition, block);

			this.onk(["particle", "speed"], (arg) => {
				this.output.output.set("particle", {
					...arg.particle,
					speed: arg.speed,
				});
			});
		}
	}

	export const Block = {
		...BlockCreation.defaults,
		id: `soundeff_speed`,
		displayName: `Particle ?: Speed`,
		description: "Changes the playback speed of the sound, along with its pitch",

		modelSource: {
			model: BlockCreation.Model.fAutoCreated("SoundLogicBlockPrefab", `SOUND SPEED`),
			category: () => BlockCreation.Categories.sound,
		},

		logic: { definition, ctor: Logic },
	};
}

//rotation - num
//rotation speed - num

//transparency - num

//color - gradient
//squash - gradient

//lifetime - vector2
//spread angle - vector2

//acceleration - vector3

export const ParticleConfigBlocks: readonly BlockBuilder[] = [SpeedEffect.Block];
