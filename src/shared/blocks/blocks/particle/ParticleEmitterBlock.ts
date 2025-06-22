import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		enabled: {
			displayName: "id",
			unit: "Asset",
			types: {
				particle: {
					config: {
						id: "the Various Particle™",
					},
				},
			},
		},
	},
	output: {},
} satisfies BlockLogicFullBothDefinitions;

type particleEmitter = BlockModel & {
	Body: {
		ParticleEmitter: ParticleEmitter;
	};
};

const updateDataType = t.interface({
	block: t.instance("Model").nominal("blockModel").as<particleEmitter>(),
	owner: t.any.as<Player>(),
});

type UpdateData = t.Infer<typeof updateDataType>;

export type { Logic as ParticleEmitterBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, particleEmitter> {
	static readonly events = {
		update: new BlockSynchronizer<UpdateData>("particle_update", updateDataType, () => {}),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onDisable(() => (this.instance.Body.ParticleEmitter.Enabled ??= false));
	}
}

export const ParticleEmitter = {
	...BlockCreation.defaults,
	id: "particleemitter",
	displayName: "Particle emitter",
	description: "Spawns various particles.",

	limit: 20,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
