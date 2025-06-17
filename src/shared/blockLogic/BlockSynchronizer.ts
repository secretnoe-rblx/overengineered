import { Players, RunService } from "@rbxts/services";
import { BidirectionalRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { ArgsSignal } from "engine/shared/event/Signal";
import { t } from "engine/shared/t";
import type { CreatableRemoteEvents } from "engine/shared/event/PERemoteEvent";
import type { BlockLogic, BlockLogicBothDefinitions } from "shared/blockLogic/BlockLogic";

/**
 * Remote event which:
 * Upon sending the value from the server, sends it to every player.
 * Upon sending the value from the client, locally executes the callback and sends it to every other player.
 * Upon a player join, sends the value to that player from the server.
 */
export class BlockSynchronizer<TArg extends { readonly block: BlockModel; reqid?: number }> {
	/** @client */
	private readonly _invoked = new ArgsSignal<[value: TArg]>();
	/** @client */
	readonly invoked = this._invoked.asReadonly();

	/** @server */
	private serverMiddleware?: (<T extends TArg>(invoker: Player | undefined, arg: T) => ObjectResponse<TArg>)[];

	private readonly event;

	/** If true, sends the event to the block owner. Useful for execting server-only middlewares like text censoring. */
	sendBackToOwner = false;

	/** If set, specifies the value that's being sent to a newly joined player. */
	getExisting?: <T extends TArg = TArg>(stored: T) => TArg;

	constructor(
		private readonly name: string,
		private readonly ttype: t.Type<TArg>,
		func?: NoInfer<(arg: TArg) => void>,
		eventType: CreatableRemoteEvents = "UnreliableRemoteEvent",
	) {
		const event = new BidirectionalRemoteEvent<TArg>(name, eventType);
		this.event = event;

		if (RunService.IsServer()) {
			let currentArg: TArg | undefined = undefined;

			event.c2s.invoked.Connect((invoker, arg) => {
				if (!t.typeCheck(arg, ttype)) {
					invoker.Kick(`Network error at ${name}`);
					return;
				}

				if (this.serverMiddleware) {
					for (const func of this.serverMiddleware) {
						const result = func(invoker, arg);
						if (!result.success) {
							$err(`Error invoking synchronizer remote ${name}: ${result.message}`);
							return;
						}

						arg = result.value;
					}
				}

				currentArg = arg;

				for (const player of Players.GetPlayers()) {
					if (player === invoker) {
						if (!this.sendBackToOwner) continue;

						event.s2c.send(player, { ...arg, reqid: arg.reqid ?? 0 });
						return;
					}

					event.s2c.send(player, arg);
				}
			});

			Players.PlayerAdded.Connect((player) => {
				if (currentArg === undefined) return;
				event.s2c.send(player, (currentArg = this.getExisting?.(currentArg) ?? currentArg));
			});
		} else if (RunService.IsClient()) {
			event.s2c.invoked.Connect((arg) => {
				if (this.sendBackToOwner && "reqid" in arg && arg.reqid) {
					// reqid is being sent to owner only

					const existingState =
						(arg.block.GetAttribute(this.reqidAttributeName()) as number | undefined) ?? 0;
					if (existingState > arg.reqid) {
						// skip invoking if the request is too old
						return;
					}
				}

				this._invoked.Fire(arg);
			});
			if (func) {
				this._invoked.Connect(func);
			}
		}
	}

	private reqidAttributeName() {
		return `reqid_${this.name}`;
	}

	addServerMiddleware(middleware: (invoker: Player | undefined, arg: TArg) => ObjectResponse<TArg>): this {
		if (!RunService.IsServer()) return this;

		this.serverMiddleware ??= [];
		this.serverMiddleware.push(middleware);
		return this;
	}

	/**
	 * Check the type of arg, burn the block if wrong. Send the event if correct.
	 */
	sendOrBurn<TDef extends BlockLogicBothDefinitions>(arg: TArg, block: BlockLogic<TDef>): void {
		if (!t.typeCheck(arg, this.ttype)) {
			block.disableAndBurn();

			try {
				t.typeCheckWithThrow(arg, this.ttype);
			} catch (ex) {
				$err(ex);
			}

			return;
		}

		this.send(arg);
	}
	send(arg: TArg): void {
		if (RunService.IsServer()) {
			if (this.serverMiddleware) {
				for (const func of this.serverMiddleware) {
					const result = func(undefined, arg);
					if (!result.success) {
						$err(`Error invoking synchronizer remote ${this.name}: ${result.message}`);
						return;
					}

					arg = result.value;
				}
			}

			this.event.s2c.send("everyone", arg);
		} else if (RunService.IsClient()) {
			if (this.sendBackToOwner) {
				const name = this.reqidAttributeName();
				arg.reqid = ((arg.block.GetAttribute(name) as number | undefined) ?? 0) + 1;
				arg.block.SetAttribute(name, arg.reqid);
			}

			this._invoked.Fire(arg);
			this.event.c2s.send(arg);
		}
	}
}
