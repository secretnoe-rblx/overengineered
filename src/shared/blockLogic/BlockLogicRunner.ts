import { Component } from "shared/component/Component";
import { ArgsSignal } from "shared/event/Signal";
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

	getContext(update: boolean, overriddenDt?: number): BlockLogicTickContext {
		if (update) {
			this.tickNumber++;
		}

		const now = os.clock();
		const dt = overriddenDt ?? now - (this.lastTickTime ?? now);
		if (update) {
			this.lastTickTime = now;
		}

		return {
			tick: this.tickNumber,
			dt,
		};
	}

	startTicking() {
		print("tick order is", this.blocks.map((i) => i.instance?.Name ?? 0).join());
		this.stopTicking();
		this.tickingLoop = this.event.loop(0, () => this.tick());
	}
	stopTicking() {
		this.tickingLoop?.Disconnect();
		this.tickingLoop = undefined;
	}

	tick(overriddenDt?: number) {
		const ctx = this.getContext(true, overriddenDt);

		for (const block of this.blocks) {
			if (!block.isEnabled()) continue;
			block.ticc(ctx);
		}
		this.ticked.Fire(ctx);
	}

	add(block: Logic) {
		this.blocks.add(block);
	}
}
