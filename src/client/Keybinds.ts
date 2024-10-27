import { ContextActionService } from "@rbxts/services";
import { ObservableMap } from "engine/shared/event/ObservableMap";
import { Signal } from "engine/shared/event/Signal";
import { Keys } from "engine/shared/fixes/Keys";

type KeybindSubscription = {
	readonly func: (input: InputObject) => void | Enum.ContextActionResult;
	readonly connection: SignalConnection;
};

class KeybindRegistration {
	private readonly indices: number[] = [];
	private readonly subscriptions: { [k in number]?: Set<KeybindSubscription> } = {};
	private keys: Set<KeyCode>;

	constructor(
		readonly action: string,
		readonly displayName: string,
		defaultKeys: readonly KeyCode[],
	) {
		this.keys = new Set(defaultKeys);

		ContextActionService.BindAction(
			this.action,
			(name, state, input) => {
				if (name !== this.action) return;
				for (const k of [...this.indices]) {
					for (const { func } of [...(this.subscriptions[k] ?? new Set())]) {
						const result = func(input);
						if (result === Enum.ContextActionResult.Sink) {
							return result;
						}
					}
				}

				return Enum.ContextActionResult.Pass;
			},
			false,
			...this.keys.map((k) => Keys[k]),
		);
	}

	getKeys() {
		return this.keys;
	}
	setKeys(keys: readonly KeyCode[]) {
		this.keys = new Set(keys);
	}

	onDown(func: KeybindSubscription["func"], priority?: number): SignalConnection {
		return this.on((input) => {
			if (input.UserInputState !== Enum.UserInputState.Begin) return;
			return func(input);
		}, priority);
	}
	onUp(func: KeybindSubscription["func"], priority?: number): SignalConnection {
		return this.on((input) => {
			if (input.UserInputState !== Enum.UserInputState.Begin) return;
			return func(input);
		}, priority);
	}
	private on(func: KeybindSubscription["func"], priority?: number): SignalConnection {
		priority ??= 0;

		const connection = Signal.connection(() => this.subscriptions[priority]?.delete(sub));
		const sub = { func, connection };

		if (!this.subscriptions[priority]) {
			this.indices.push(priority);
			this.indices.sort();
		}
		(this.subscriptions[priority] ??= new Set()).add(sub);

		return connection;
	}
}

export class Keybinds {
	private readonly _registrations = new ObservableMap<string, KeybindRegistration>();
	readonly registrations = this._registrations.asReadonly();

	register(action: string, displayName: string, keys: readonly KeyCode[]): KeybindRegistration {
		let registration = this._registrations.get(action);
		if (!registration) {
			this._registrations.set(action, (registration = new KeybindRegistration(action, displayName, keys)));
		}

		return registration;
	}

	get(action: string): KeybindRegistration {
		const registration = this._registrations.get(action);
		if (!registration) {
			throw `Unknown registration ${action}`;
		}

		return registration;
	}
}
