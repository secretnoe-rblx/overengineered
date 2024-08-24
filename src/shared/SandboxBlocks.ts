import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { DelayBlock } from "shared/blocks/blocks/DelayBlock";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { BasicOperationBlocks } from "shared/blocks/blocks/grouped/BasicOperationBlocks";
import { BuildingBlocks } from "shared/blocks/blocks/grouped/BuildingBlocks";
import { WheelBlocks } from "shared/blocks/blocks/grouped/WheelBlocks";
import { ScreenBlock } from "shared/blocks/blocks/ScreenBlock";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (): BlockList => {
	const blocksArr = [
		...BuildingBlocks,
		...BasicOperationBlocks,
		...WheelBlocks,

		DisconnectBlock,
		DelayBlock,
		ScreenBlock,
		VehicleSeatBlock,
		//
	] as const satisfies BlockBuilder[];

	return BlockListBuilder.buildBlockList(blocksArr);
};
