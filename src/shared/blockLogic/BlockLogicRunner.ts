import { Component } from "shared/component/Component";
import type { BlockLogic4, BlockLogicFullBothDefinitions, BlockLogicTickContext } from "shared/blockLogic/BlockLogic4";

type Logic = BlockLogic4<BlockLogicFullBothDefinitions>;

export class BlockLogicRunner extends Component {
	private readonly blocks = new Set<Logic>();
	private tickingLoop?: SignalConnection;
	private tickNumber = 0;

	constructor() {
		super();
	}

	startTicking() {
		this.stopTicking();
		this.tickingLoop = this.event.loop(0, () => this.tick());
	}
	stopTicking() {
		this.tickingLoop?.Disconnect();
		this.tickingLoop = undefined;
	}

	tick() {
		this.tickNumber++;

		const ctx: BlockLogicTickContext = {
			tick: this.tickNumber,
		};

		for (const block of this.blocks) {
			if (!block.isEnabled()) continue;
			block.tick(ctx);
		}
	}

	add(block: Logic) {
		this.blocks.add(block);
	}
}
