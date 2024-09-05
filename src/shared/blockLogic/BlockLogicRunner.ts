import { Component } from "shared/component/Component";
import type { BlockLogic, BlockLogicFullBothDefinitions, BlockLogicTickContext } from "shared/blockLogic/BlockLogic";

type Logic = BlockLogic<BlockLogicFullBothDefinitions>;

export class BlockLogicRunner extends Component {
	private readonly ticked = new ArgsSignal<[ctx: BlockLogicTickContext]>();

	private readonly blocks = new Set<Logic>();
	private tickingLoop?: SignalConnection;
	private tickNumber = 0;
	private lastTickTime?: number;

	onAfterTick(func: (ctx: BlockLogicTickContext) => void): SignalConnection {
		return this.ticked.Connect(func);
	}

	getTick() {
		return this.tickNumber;
	}

	startTicking() {
		this.stopTicking();
		this.tickingLoop = this.event.loop(0, () => this.tick());
	}
	stopTicking() {
		this.tickingLoop?.Disconnect();
		this.tickingLoop = undefined;
	}

	tick(overriddenDt?: number) {
		this.tickNumber++;

		const now = DateTime.now().UnixTimestampMillis / 1000;
		this.lastTickTime ??= now;

		const ctx: BlockLogicTickContext = {
			tick: this.tickNumber,
			dt: overriddenDt ?? this.lastTickTime - now,
		};

		for (const block of this.blocks) {
			if (!block.isEnabled()) continue;
			block.tick(ctx);
		}
		this.ticked.Fire(ctx);
	}

	add(block: Logic) {
		this.blocks.add(block);
	}
}
