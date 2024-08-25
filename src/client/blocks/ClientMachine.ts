import { ClientBlockControls } from "client/blocks/ClientBlockControls";
import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { SharedMachine } from "shared/blockLogic/SharedMachine";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { ImpactController } from "shared/block/impact/ImpactController";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";
import type { ILogicValueStorage } from "shared/blockLogic/BlockLogicValueStorage";

@injectable
export class ClientMachine extends SharedMachine {
	constructor(
		@inject private readonly playerData: PlayerDataStorage,
		@inject blockList: BlockList,
		@inject di: DIContainer,
	) {
		super(blockList, di);
	}

	protected initialize(blocks: readonly PlacedBlockData[]) {
		super.initialize(blocks);
		this.initializeControls();
	}
	protected createImpactControllerIfNeeded(blocks: readonly PlacedBlockData[]): ImpactController | undefined {
		if (!this.playerData.config.get().impact_destruction) {
			return undefined;
		}

		return super.createImpactControllerIfNeeded(blocks);
	}

	initializeControls() {
		for (const [, { block, logic }] of this.blocksMap) {
			const config = BlockConfig.addDefaults(block.config, logic.definition.input);
			for (const [k, v] of pairs(config)) {
				const inType = logic.definition.input[k].types[v.type]?.type;
				if (!inType) continue;

				const ctor = ClientBlockControls[inType];
				if (!ctor) continue;

				const input = logic.input[k] as
					| (typeof logic)["input"][typeof k]
					| ILogicValueStorage<keyof BlockLogicTypes.Primitives>;
				if (!("set" in input)) continue;

				const control = new ctor(input, config[k].config, logic.definition.input[k].types[config[k].type]!);
				this.parent(control);

				this.event.subscribeObservable(
					this.occupiedByLocalPlayer,
					(enabled) => {
						if (enabled) control.enable();
						else control.disable();
					},
					true,
				);
			}
		}
	}
}
