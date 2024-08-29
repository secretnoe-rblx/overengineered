import type { BlockMirrorBehaviour } from "shared/BlockDataRegistry";
import type { BlockLogicFullBothDefinitions, GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";
import type { BlockCreation } from "shared/blocks/BlockCreation";
import type { DisconnectBlock } from "shared/blocks/blocks/DisconnectBlock";
import type { BasicOperationBlockIds } from "shared/blocks/blocks/grouped/BasicOperationBlocks";
import type { BuildingBlockIds } from "shared/blocks/blocks/grouped/BuildingBlocks";
import type { LampBlockIds } from "shared/blocks/blocks/grouped/LampBlocks";
import type { ServoMotorBlockIds } from "shared/blocks/blocks/grouped/ServoMotorBlocks";
import type { TNTBlockIds } from "shared/blocks/blocks/grouped/TNTBlocks";
import type { WheelBlockIds } from "shared/blocks/blocks/grouped/WheelBlocks";
import type { WingBlockIds } from "shared/blocks/blocks/grouped/WingsBlocks";
import type { RocketBlockIds } from "shared/blocks/blocks/RocketEngineBlocks";

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
export type BlockBuildersWithoutIdAndDefaults = { readonly [k in string]: BlockBuilderWithoutIdAndDefaults };

declare global {
	type BlockId =
		| string
		| (string &
				BuildingBlockIds &
				BasicOperationBlockIds &
				WheelBlockIds &
				RocketBlockIds &
				LampBlockIds &
				WingBlockIds &
				ServoMotorBlockIds &
				TNTBlockIds &
				(typeof DisconnectBlock)["id"]);

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
