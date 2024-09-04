import { BlockLogicRunner } from "shared/blockLogic/BlockLogicRunner";
import type { GenericBlockLogic } from "shared/blockLogic/BlockLogic";

export class BlockTestRunner {
	private readonly runner = new BlockLogicRunner();

	add(...blocks: GenericBlockLogic[]) {
		for (const block of blocks) {
			this.runner.add(block);
		}
	}

	getTick() {
		return this.runner.getTick();
	}
	tick(amount: number = 1, dt?: number) {
		for (let i = 0; i < amount; i++) {
			this.runner.tick(dt);
		}
	}
}
