import { InstanceBlockLogic } from "shared/blockLogic/BlockLogic";
import { BlockCreation } from "shared/blocks/BlockCreation";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { BuildingManager } from "shared/building/BuildingManager";
import { RemoteEvents } from "shared/RemoteEvents";
import { RobloxUnit } from "shared/RobloxUnit";
import type { BlockLogicFullBothDefinitions, InstanceBlockLogicArgs } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/Block";

const definition = {
	input: {
		assemblyonly: {
			displayName: "Assembly Only",
			types: {
				bool: {
					config: false,
				},
			},
			connectorHidden: true,
		},
	},
	output: {
		result: {
			displayName: "Mass (kg)",
			types: ["number"],
		},
	},
} satisfies BlockLogicFullBothDefinitions;

export type { Logic as MassSensorBlockLogic };
class Logic extends InstanceBlockLogic<typeof definition> {
	constructor(block: InstanceBlockLogicArgs) {
		super(definition, block);

		const assemblyOnlyCache = this.initializeInputCache("assemblyonly");

		const update = () => {
			if (!this.instance.PrimaryPart) {
				this.disable();
				return;
			}

			const assemblyOnly = assemblyOnlyCache.tryGet();
			if (!assemblyOnly) return;

			this.output.result.set(
				"number",
				RobloxUnit.RMU_To_Kilograms(
					assemblyOnly ? this.instance.PrimaryPart.AssemblyMass : this.getBuildingMass(),
				),
			);
		};

		this.event.subscribe(DisconnectBlock.logic.ctor.events.disconnect.clientInvoked, update);
		this.event.subscribe(RemoteEvents.ImpactBreak.clientInvoked, update);

		this.onStart(update);
	}

	private getBuildingMass() {
		let mass = 0;
		for (const block of BuildingManager.getMachineBlocks(this.instance)) {
			for (const desc of block.GetDescendants()) {
				if (!desc.IsA("BasePart")) continue;
				mass += desc.Mass;
			}
		}

		return mass;
	}
}

export const MassSensorBlock = {
	...BlockCreation.defaults,
	id: "masssensor",
	displayName: "Mass Sensor",
	description: "Returns the current contraption/assembly mass",

	logic: { definition, ctor: Logic },
} as const satisfies BlockBuilder;
