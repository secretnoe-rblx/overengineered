import { Component } from "engine/shared/component/Component";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ArgsSignal } from "engine/shared/event/Signal";
import type { BlockLogic, BlockLogicFullBothDefinitions, BlockLogicTickContext } from "shared/blockLogic/BlockLogic";

type Logic = BlockLogic<BlockLogicFullBothDefinitions>;

export class BlockLogicRunner extends Component {
	private readonly ticked = new ArgsSignal<[ctx: BlockLogicTickContext]>();

	private readonly blocks = new Set<Logic>();
	private tickingLoop?: SignalConnection;
	private tickNumber = 0;
	private lastTickTime?: number;
	private readonly _isRunning = new ObservableValue(false);
	readonly isRunning = this._isRunning.asReadonly();

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
		this.stopTicking();
		this._isRunning.set(true);
		this.tickingLoop = this.event.loop(0, () => this.tick());
	}
	stopTicking() {
		this._isRunning.set(false);
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
