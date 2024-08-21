import { BlockListBuilder } from "shared/blocks/BlockListBuilder";
import { BuildingBlocks } from "shared/blocks/blocks/BuildingBlocks";
import { ConstantBlock } from "shared/blocks/blocks/ConstantBlock";
import { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import { MathBlocks } from "shared/blocks/blocks/math/MathBlocks";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import type { BlockBuilder } from "shared/blocks/Block";

export const CreateSandboxBlocks = (): BlockList => {
	const blocksArr = [
		...BuildingBlocks,
		...MathBlocks,

		DisconnectBlock,
		VehicleSeatBlock,
		ConstantBlock,
		//
	] as const satisfies BlockBuilder[];

	return BlockListBuilder.buildBlockList(blocksArr);
};
