import { Add, BlockTicker, NumberBlockLogicInputSource } from "shared/blockLogic/BlockLogic2";

export namespace _Tests {
	export namespace BlockLogic2Tests {
		export function test3() {
			const blocks = [new Add(), new Add()];

			const num = new NumberBlockLogicInputSource();
			num.output.set("number", 1);
			num.output.connectTo(blocks[0].input.value1);
			num.output.connectTo(blocks[0].input.value2);

			if (true as boolean) {
				num.output.connectTo(blocks[1].input.value1);
			} else {
				blocks[0].output.result.connectTo(blocks[1].input.value1);
			}
			blocks[0].output.result.connectTo(blocks[1].input.value2);

			blocks[0].output.result.changed.Connect((value) => print("RESULT 0 IS", value));
			blocks[1].output.result.changed.Connect((value) => print("RESULT 1 IS", value));

			for (const block of blocks) {
				block.enable();
			}
			num.output.enable();

			const ticker = new BlockTicker([num.output, ...blocks.flatmap((b) => asMap(b.output).values())]);

			print(
				blocks.map((b) => b.input.value1.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.input.value2.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.output.result.get()![0] ?? "n").join(""),
			);

			ticker.tick();

			print(
				blocks.map((b) => b.input.value1.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.input.value2.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.output.result.get()![0] ?? "n").join(""),
			);

			print("SETTING");
			num.output.set("number", 2);

			print(
				blocks.map((b) => b.input.value1.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.input.value2.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.output.result.get()![0] ?? "n").join(""),
			);

			ticker.tick();

			print(
				blocks.map((b) => b.input.value1.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.input.value2.get()![0] ?? "n").join(""),
				"---",
				blocks.map((b) => b.output.result.get()![0] ?? "n").join(""),
			);
		}
	}
}
