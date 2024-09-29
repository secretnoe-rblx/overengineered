import { DIContainer } from "engine/shared/di/DIContainer";
import { Objects } from "engine/shared/fixes/objects";
import { BlockTestRunner } from "shared/blocks/testing/BlockTestRunner";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { GenericBlockLogic } from "shared/blockLogic/BlockLogic";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

export namespace BlockTesting {
	export const blockList = CreateSandboxBlocks(new DIContainer({}));

	export function newBlock(id: string) {
		return new blockList.blocks[id]!.logic!.ctor({ instance: undefined! });
	}
	export function create(blocks: { readonly id: string; readonly config: PlacedBlockConfig }[]) {
		const arr = blocks.map((b) => newBlock(b.id));
		const blocksMap = asMap(
			Objects.map(
				arr,
				(k) => tostring((k as number) - 1) as BlockUuid,
				(k, v) => v,
			),
		);

		for (let i = 0; i < blocks.size(); i++) {
			const block = arr[i];
			const config = blocks[i].config;

			block.initializeInputs(config, blocksMap);
		}
		for (const block of arr) {
			block.enable();
		}

		return arr;
	}

	export function runner(...blocks: GenericBlockLogic[]) {
		const runner = new BlockTestRunner();
		runner.add(...blocks);

		return runner;
	}

	//

	export function wire(
		uuid: number | string,
		connectionName: string,
	): { type: "wire"; config: BlockLogicTypes.WireValue } {
		return {
			type: "wire",
			config: {
				blockUuid: tostring(uuid) as never,
				connectionName: connectionName as never,
				prevConfig: undefined,
			},
		};
	}
	export function num(value: number) {
		return { type: "number", config: value } as const;
	}
	export function bool(value: boolean) {
		return { type: "bool", config: value } as const;
	}
	export function vector3(value: Vector3) {
		return { type: "vector3", config: value } as const;
	}
}
