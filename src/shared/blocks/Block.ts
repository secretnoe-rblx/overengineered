import type { BlockConfigBothDefinitions, GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";
import type { BlockBuilder } from "shared/blocks/BlockCreation";

export type BlockCategoryPath = readonly string[];
export type BlockLogicInfo = {
	readonly config: BlockConfigBothDefinitions;
	readonly ctor: GenericBlockLogicCtor;
};

export type BlockMarkerPositions = {
	readonly [name in string]?: Vector3;
};
export type BlockWeldRegions = Model;

declare global {
	type Block = Omit<BlockBuilder, "id" | (`${string}Source` & keyof BlockBuilder)> & {
		readonly id: BlockId;
		readonly model: BlockModel;
		readonly category: BlockCategoryPath;
		readonly markerPositions: BlockMarkerPositions;
		readonly weldRegions: BlockWeldRegions;
	};

	type GenericBlockList = {
		readonly [k in string]: Block | undefined;
	};
	type BlockList = {
		readonly blocks: GenericBlockList;
		readonly sorted: readonly Block[];
	};
}
