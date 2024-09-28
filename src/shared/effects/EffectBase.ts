import { BidirectionalRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { SharedImpl } from "shared/SharedImpl";
import type { CreatableRemoteEvents } from "engine/shared/event/RemoteEventBase";

abstract class _EffectBase<T> {
	readonly event;

	constructor(name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		this.event = new BidirectionalRemoteEvent<T>(name, eventType);
	}

	protected abstract justRun(arg: T): void;

	send(ownerPart: BasePart, arg: T): void {}
}
export type { _EffectBase };

const impl = SharedImpl.getSharedImpl(script);
const req = require(impl) as { EffectBase: typeof _EffectBase };
export const EffectBase = req.EffectBase;
