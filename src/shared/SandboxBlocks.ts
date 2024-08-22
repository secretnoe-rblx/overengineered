import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { BasicOperationBlocks } from "shared/blocks/blocks/BasicOperationBlocks";
import { BuildingBlocks } from "shared/blocks/blocks/BuildingBlocks";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { ScreenBlock } from "shared/blocks/blocks/ScreenBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (): BlockList => {
	const blocksArr = [
		...BuildingBlocks,
		...BasicOperationBlocks,

		DisconnectBlock,
		ScreenBlock,
		VehicleSeatBlock,
		//
	] as const satisfies BlockBuilder[];

	return BlockListBuilder.buildBlockList(blocksArr);
};
