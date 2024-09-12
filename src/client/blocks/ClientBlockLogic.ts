import { Workspace } from "@rbxts/services";
import type { GenericBlockLogicCtor } from "shared/blockLogic/BlockLogic";

export abstract class ClientBlockLogic<T extends GenericBlockLogicCtor> {
	readonly logic;

	constructor(logic: T) {
		this.logic = logic;
	}

	protected isValidBlock(block: BlockModel | undefined): boolean {
		if (!block) return false;
		if (!block.IsDescendantOf(Workspace)) return false;

		return true;
	}
}
