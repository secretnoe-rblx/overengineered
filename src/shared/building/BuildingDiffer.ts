import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { LatestSerializedBlock } from "shared/building/BlocksSerializer";

export type DiffBlock = Replace<LatestSerializedBlock, "uuid", string>;

type RemovedChange = {
	readonly type: "removed";
	readonly uuid: DiffBlock["uuid"];
};
type AddedChange = {
	readonly type: "added";
	readonly block: {
		readonly id: BlockId;
		readonly uuid: DiffBlock["uuid"];
		readonly location: CFrame;
	};
};

type ConfigChangedChange = {
	readonly type: "configChanged";
	readonly uuid: DiffBlock["uuid"];
	readonly key: string;
	readonly value: PartialThrough<PlacedBlockConfig[string]> | undefined;
};
type MovedChange = {
	readonly type: "moved";
	readonly uuid: DiffBlock["uuid"];
	readonly to: Vector3;
};
type RotatedChange = {
	readonly type: "rotated";
	readonly uuid: DiffBlock["uuid"];
	readonly toRotation: CFrame;
};

export type BuildingDiffChange = RemovedChange | AddedChange | ConfigChangedChange | MovedChange | RotatedChange;
