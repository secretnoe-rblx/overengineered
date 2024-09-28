import { Assert } from "engine/shared/Assert";
import { Objects } from "engine/shared/fixes/objects";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import type { UnitTests } from "engine/shared/TestFramework";
import type { PlacedBlockConfig } from "shared/blockLogic/BlockConfig";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

namespace BlockLogicTests {
	export function test2() {
		const blockList = CreateSandboxBlocks();

		const newBlock = (id: string) => new blockList.blocks[id]!.logic!.ctor({ instance: undefined! });
		const create = (blocks: { readonly id: string; readonly config: PlacedBlockConfig }[]) => {
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

			return arr;
		};
		const wire = (
			uuid: number | string,
			connectionName: string,
		): { type: "wire"; config: BlockLogicTypes.WireValue } => {
			return {
				type: "wire",
				config: {
					blockUuid: tostring(uuid) as never,
					connectionName: connectionName as never,
					prevConfig: undefined,
				},
			};
		};
		const num = (value: number): { type: "number"; config: BlockLogicTypes.Number["config"] } => {
			return { type: "number", config: value };
		};

		const blocks = create([
			{
				id: "add",
				config: { value1: wire(2, "result"), value2: num(3) },
			},
			{
				id: "add",
				config: { value1: wire(0, "result"), value2: wire(0, "result") },
			},
			{
				id: "constant",
				config: { value: num(4) },
			},
		]);

		const result1 = blocks[0].getOutputValue({ tick: 1, dt: 0 }, "result");
		print(result1);
		Assert.isNot(result1, "string");
		Assert.propertiesEqual(result1, { value: 7 });

		const result2 = blocks[1].getOutputValue({ tick: 1, dt: 0 }, "result");
		print(result2);
		Assert.isNot(result2, "string");
		Assert.propertiesEqual(result2, { value: 14 });

		const result3 = blocks[2].getOutputValue({ tick: 1, dt: 0 }, "result");
		print(result3);
		Assert.isNot(result3, "string");
		Assert.propertiesEqual(result3, { value: 4 });
	}
}
export const _Tests: UnitTests = { BlockLogicTests };
