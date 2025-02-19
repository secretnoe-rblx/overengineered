import type { BidirectionalRemoteEvent } from "engine/shared/event/PERemoteEvent";
import type { CreatableRemoteEvents } from "engine/shared/event/RemoteEventBase";

export interface EEEffect<T> {
	readonly event: BidirectionalRemoteEvent<T>;

	send(ownerPart: BasePart, arg: T): void;
}

export interface EffectCreator {
	create<T>(name: string, eventType: CreatableRemoteEvents, func?: (arg: T) => void): EEEffect<T>;
}

export abstract class EffectBase<T> {
	private readonly effect;
	readonly event;

	constructor(creator: EffectCreator, name: string, eventType: CreatableRemoteEvents = "UnreliableRemoteEvent") {
		this.effect = creator.create<T>(name, eventType, (arg) => this.justRun(arg));
		this.event = this.effect.event;
	}

	send(ownerPart: BasePart, arg: T) {
		this.effect.send(ownerPart, arg);
	}

	abstract justRun(arg: T): void;
}
