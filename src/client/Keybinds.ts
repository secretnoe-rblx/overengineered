import { ContextActionService } from "@rbxts/services";
import { ObservableMap } from "engine/shared/event/ObservableMap";
import { ObservableValue } from "engine/shared/event/ObservableValue";
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

	private readonly _isPressed = new ObservableValue(false);
	readonly isPressed = this._isPressed.asReadonly();

	constructor(
		readonly action: string,
		readonly displayPath: readonly string[],
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

		this.onDown(() => this._isPressed.set(true));
		this.onUp(() => this._isPressed.set(false));
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
			if (input.UserInputState !== Enum.UserInputState.End) return;
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

export interface KeybindDefinition {
	readonly action: string;
	readonly displayPath: readonly string[];
	readonly keys: readonly KeyCode[];
}

export class Keybinds {
	private static readonly definitions = new ObservableMap<string, KeybindDefinition>();

	static registerDefinition(
		action: string,
		displayPath: readonly string[],
		keys: readonly KeyCode[],
	): KeybindDefinition {
		let definition = this.definitions.get(action);
		if (!definition) {
			this.definitions.set(action, (definition = { action, displayPath, keys }));
		}

		return definition;
	}

	private readonly _registrations = new ObservableMap<string, KeybindRegistration>();
	readonly registrations = this._registrations.asReadonly();

	fromDefinition({ action, displayPath, keys }: KeybindDefinition): KeybindRegistration {
		return this.register(action, displayPath, keys);
	}

	register(action: string, displayPath: readonly string[], keys: readonly KeyCode[]): KeybindRegistration {
		let registration = this._registrations.get(action);
		if (!registration) {
			this._registrations.set(action, (registration = new KeybindRegistration(action, displayPath, keys)));
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
