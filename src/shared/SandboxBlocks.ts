import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { BasicOperationBlocks } from "shared/blocks/blocks/BasicOperationBlocks";
import { BuildingBlocks } from "shared/blocks/blocks/BuildingBlocks";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (): BlockList => {
	const blocksArr = [
		...BuildingBlocks,
		...BasicOperationBlocks,

		DisconnectBlock,
		VehicleSeatBlock,
		//
	] as const satisfies BlockBuilder[];

	return BlockListBuilder.buildBlockList(blocksArr);
};
