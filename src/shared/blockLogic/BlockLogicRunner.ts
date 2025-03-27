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

	readonly overclock = new ObservableValue<{ type: "speedup" | "slowdown"; multiplier: number }>({
		type: "speedup",
		multiplier: 1,
	});

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

	private ticksSinceLast = 0;
	tick(overriddenDt?: number) {
		const overclock = this.overclock.get();

		const tick = () => {
			const ctx = this.getContext(true, overriddenDt);

			for (const block of this.blocks) {
				if (!block.isEnabled()) continue;

				try {
					block.ticc(ctx);
				} catch (err) {
					$warn(err);
					block.disableAndBurn();
				}
			}
			this.ticked.Fire(ctx);
		};

		if (overclock.type === "speedup") {
			for (let i = 0; i < overclock.multiplier; i++) {
				tick();
			}
		} else if (overclock.type === "slowdown") {
			this.ticksSinceLast = (this.ticksSinceLast + 1) % overclock.multiplier;
			if (this.ticksSinceLast === 0) {
				tick();
			}
		} else overclock.type satisfies never;
	}

	add(block: Logic) {
		this.blocks.add(block);
	}
}
