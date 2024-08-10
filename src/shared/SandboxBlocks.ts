import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { BuildingBlocks } from "shared/blocks/blocks/BuildingBlocks";
import { ConstantBlock } from "shared/blocks/blocks/ConstantBlock";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import type { BlockBuilder } from "shared/blocks/BlockCreation";

export const CreateSandboxBlocks = (): BlockList => {
	const blocksArr = [
		...BuildingBlocks,

		DisconnectBlock,
		VehicleSeatBlock,
		ConstantBlock,
		//
	] as const satisfies BlockBuilder[];

	return BlockListBuilder.buildBlockList(blocksArr);
};
