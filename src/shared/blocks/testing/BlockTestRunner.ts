import { BlockLogicRunner } from "shared/blockLogic/BlockLogicRunner";
import type { BlockLogicTickContext, GenericBlockLogic } from "shared/blockLogic/BlockLogic";

export class BlockTestRunner {
	private readonly runner = new BlockLogicRunner();

	add(...blocks: GenericBlockLogic[]) {
		for (const block of blocks) {
			this.runner.add(block);
		}
	}

	getContext(overriddenDt?: number): BlockLogicTickContext {
		return this.runner.getContext(false, overriddenDt);
	}
	moveContextForward(overriddenDt?: number): void {
		this.runner.getContext(true, overriddenDt);
	}

	tick(amount: number = 1, dt?: number) {
		for (let i = 0; i < amount; i++) {
			this.runner.tick(dt);
		}
	}
}
