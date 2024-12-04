import { ContextActionService, UserInputService } from "@rbxts/services";
import { ObservableMap } from "engine/shared/event/ObservableMap";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import { Keys } from "engine/shared/fixes/Keys";
import { Strings } from "engine/shared/fixes/String.propmacro";

type KeybindSubscription = {
	readonly func: (input: InputObject) => Enum.ContextActionResult | Enum.ContextActionResult["Name"];
	readonly connection: SignalConnection;
};

export type { KeybindRegistration };
class KeybindRegistration {
	private readonly indices: number[] = [];
	private readonly subscriptions: { [k in number]?: Set<KeybindSubscription> } = {};
	private keys: readonly KeyCombination[];

	private readonly _isPressed = new ObservableValue(false);
	readonly isPressed = this._isPressed.asReadonly();

	constructor(
		readonly action: string,
		readonly displayPath: readonly string[],
		defaultKeys: readonly KeyCombination[],
	) {
		this.keys = defaultKeys;
		this.register();

		this.onDown(() => {
			this._isPressed.set(true);
			return "Pass";
		});
		this.onUp(() => {
			this._isPressed.set(false);
			return "Pass";
		});
	}

	private register() {
		ContextActionService.UnbindAction(this.action);
		ContextActionService.BindAction(
			this.action,
			(name, state, input) => {
				if (name !== this.action) return;

				const anyPressed = this.keys.any((comb) => comb.all((k) => UserInputService.IsKeyDown(k)));
				if (!anyPressed) return Enum.ContextActionResult.Pass;

				for (const k of [...this.indices]) {
					if (!this.subscriptions[k]) continue;

					for (const { func } of [...this.subscriptions[k]]) {
						const result = func(input);
						if (result === undefined) {
							print("returning udefined", Strings.pretty(this.subscriptions), Strings.pretty(this.keys));
						}
						if (result === Enum.ContextActionResult.Sink || result === "Sink") {
							return Enum.ContextActionResult.Sink;
						}
					}
				}

				return Enum.ContextActionResult.Pass;
			},
			false,
			...this.keys.flatmap((k) => k.map((k) => Keys.Keys[k])),
		);
	}

	getKeys(): readonly KeyCombination[] {
		return this.keys;
	}
	setKeys(keys: readonly KeyCombination[]) {
		this.keys = keys;
		this.register();
	}

	onDown(func: KeybindSubscription["func"], priority?: number): SignalConnection {
		return this.on((input) => {
			if (input.UserInputState !== Enum.UserInputState.Begin) {
				return "Pass";
			}

			return func(input);
		}, priority);
	}
	onUp(func: KeybindSubscription["func"], priority?: number): SignalConnection {
		return this.on((input) => {
			if (input.UserInputState !== Enum.UserInputState.End) {
				return "Pass";
			}

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

export type KeyCombination = readonly KeyCode[];
export interface KeybindDefinition {
	readonly action: string;
	readonly displayPath: readonly string[];
	readonly keys: readonly KeyCombination[];
}

export class Keybinds {
	private static readonly definitions = new ObservableMap<string, KeybindDefinition>();

	static registerDefinition(
		action: string,
		displayPath: readonly string[],
		keys: readonly KeyCombination[],
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

	register(action: string, displayPath: readonly string[], keys: readonly KeyCombination[]): KeybindRegistration {
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
