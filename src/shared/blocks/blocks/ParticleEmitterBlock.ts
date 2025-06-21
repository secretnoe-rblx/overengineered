import { t } from "engine/shared/t";
import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockSynchronizer } from "shared/blockLogic/BlockSynchronizer";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { Colors } from "shared/Colors";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		enabled: {
			displayName: "Enabled",
			tooltip: "Enable/disable beacon visibility.",
			unit: "state",
			types: {
				bool: {
					config: true,
				},
			},
		},
		text: {
			displayName: "Text",
			tooltip: "The text that will appear under the beacon's marker.",
			types: {
				string: {
					config: "New Beacon",
				},
			},
		},
		showUpDistance: {
			displayName: "Show Up Distance",
			tooltip: "The distance at which you can see the marker.",
			unit: "meters",
			types: {
				number: {
					config: 0,
				},
			},
		},
		markerColor: {
			displayName: "Marker Color",
			tooltip: "The color of the marker.",
			types: {
				color: {
					config: Colors.green,
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
	connectToRootPart: t.boolean,
	key: t.any.as<KeyCode>(),
});

type UpdateData = t.Infer<typeof updateDataType>;

export type { Logic as ParticleEmitterBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition, particleEmitter> {
	static readonly events = {
		update: new BlockSynchronizer<UpdateData>("particle_update", updateDataType, () => {}),
	} as const;

	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		this.onDisable(() => (this.instance.Body.ParticleEmitter.Enabled = false));
	}
}

export const BeaconBlock = {
	...BlockCreation.defaults,
	id: "particlespawner",
	displayName: "Beacon",
	description: "Spawns various particles.",

	limit: 20,

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
