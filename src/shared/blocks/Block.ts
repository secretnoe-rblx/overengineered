import type { BlockMirrorBehaviour } from "shared/BlockDataRegistry";
import type { BlockLogicFullBothDefinitions, GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";
import type { BlockCreation } from "shared/blocks/BlockCreation";
import type { BuildingBlockIds } from "shared/blocks/blocks/BuildingBlocks";
import type { MathBlockIds } from "shared/blocks/blocks/math/MathBlocks";

export type BlockCategoryPath = readonly string[];
export type BlockLogicInfo = {
	readonly definition: BlockLogicFullBothDefinitions;
	readonly ctor: GenericBlockLogicCtor;
};
export type BlockModelSource = {
	readonly model: (self: BlockBuilder) => BlockModel;
	readonly category: (self: BlockBuilder, model: BlockModel) => BlockCategoryPath;
};

export type BlockMarkerPositions = {
	readonly [name in string]?: Vector3;
};
export type BlockWeldRegions = Model;

export type BlockBuilder = {
	readonly id: string;
	readonly displayName: string;
	readonly description: string;
	readonly logic?: BlockLogicInfo;
	readonly required: boolean;
	readonly limit: number;
	readonly mirror: {
		readonly behaviour: BlockMirrorBehaviour;
		readonly replacementId?: string;
	};

	/** @server */
	readonly modelSource: BlockModelSource;

	/** @server */
	readonly weldRegionsSource: (self: BlockBuilder, model: BlockModel) => BlockWeldRegions;
	/** @server */
	readonly markerPositionsSource: (self: BlockBuilder, model: BlockModel) => BlockMarkerPositions;
};
export type BlockBuilderWithoutId = Omit<BlockBuilder, "id">;
export type BlockBuilderWithoutIdAndDefaults = MakePartial<BlockBuilderWithoutId, keyof typeof BlockCreation.defaults>;

declare global {
	type BlockId = string | (string & BuildingBlockIds & MathBlockIds);

	type Block = Omit<BlockBuilder, "id" | (`${string}Source` & keyof BlockBuilder)> & {
		readonly id: BlockId;
		readonly model: BlockModel;
		readonly category: BlockCategoryPath;
		readonly markerPositions: BlockMarkerPositions;
		readonly weldRegions: BlockWeldRegions;
	};

	type GenericBlockList = {
		readonly [k in BlockId]: Block | undefined;
	};
	type BlockList = {
		readonly blocks: GenericBlockList;
		readonly sorted: readonly Block[];
	};
}
