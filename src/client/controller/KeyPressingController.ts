import { ClientComponent } from "client/component/ClientComponent";
import { Signal } from "shared/event/Signal";
import { isKey } from "shared/fixes/Keys";

/*
	When a key is pressed, invoke keyDown()
	When a key is released, invoke keyUp()
*/
export class KeyPressingController<TKeys extends string> {
	readonly onKeyDown = new Signal<(key: TKeys) => void>();
	readonly onKeyUp = new Signal<(key: TKeys) => void>();
	private readonly pressed: TKeys[] = [];

	isAnyDown(keys: readonly TKeys[]) {
		return keys.any((k) => this.isDown(k));
	}
	isDown(key: TKeys) {
		return this.pressed.includes(key);
	}

	keyDown(key: TKeys) {
		if (this.isDown(key)) return;

		this.pressed.push(key);
		this.onKeyDown.Fire(key);
	}
	keyUp(key: TKeys) {
		if (!this.isDown(key)) return;

		this.pressed.remove(this.pressed.indexOf(key));
		this.onKeyUp.Fire(key);
	}

	releaseAll() {
		for (const pressed of this.pressed) {
			this.keyUp(pressed);
		}

		this.pressed.clear();
	}
}

/*
	When a key is pressed,
		if `def.conflicts` is not null,
		and `def.conflicts` key is pressed,
			invoke keyUp() on the conflicted key
		else
			super()
	
	When a key is released,
		if `def.conflicts` is not null,
		and `def.conflicts` key is pressed,
			invoke keyDown() on the conflicted key
		else
			super()
*/
export class KeyPressingConflictingController<TKeys extends string> extends KeyPressingController<TKeys> {
	private readonly definitions;
	private readonly holding = new Set<TKeys>();

	constructor(definitions: Readonly<Partial<Record<TKeys, { readonly conflicts?: readonly TKeys[] }>>>) {
		super();
		this.definitions = definitions;
	}

	keyDown(key: TKeys) {
		if (this.isDown(key)) return;

		const def = this.definitions[key];
		if (def?.conflicts && this.isAnyDown(def.conflicts)) {
			for (const conflict of def.conflicts) {
				if (!this.isDown(conflict)) continue;

				this.keyUp(conflict);
				this.holding.add(conflict);
			}
			this.holding.add(key);

			return;
		}

		super.keyDown(key);
	}
	keyUp(key: TKeys) {
		if (!this.isDown(key) && !this.holding.has(key)) return;

		const def = this.definitions[key];
		const conflict = def?.conflicts && this.holding.find((h) => def.conflicts!.includes(h));
		if (conflict) {
			this.holding.delete(key);
			this.holding.delete(conflict);

			this.keyDown(conflict);
			return;
		}

		super.keyUp(key);
	}

	releaseAll() {
		this.holding.clear();
		super.releaseAll();
	}
}

export type KeyDefinition<TKeys extends string> = {
	readonly key: string | KeyCode;
	readonly keyDown?: () => void;
	readonly keyUp?: () => void;
	readonly conflicts?: readonly TKeys[];
};
export type KeyDefinitions<TKeys extends string> = { readonly [k in TKeys]: KeyDefinition<TKeys> };

export class KeyPressingDefinitionsController<T extends KeyDefinitions<string>> extends ClientComponent {
	readonly controller;

	constructor(definitions: T) {
		super();
		this.controller = new KeyPressingConflictingController<keyof T & string>(definitions);
		this.onDisable(() => this.controller.releaseAll());

		this.event.subscribe(this.controller.onKeyDown, (key) => definitions[key]?.keyDown?.());
		this.event.subscribe(this.controller.onKeyUp, (key) => definitions[key]?.keyUp?.());

		for (const [key, def] of pairs(definitions)) {
			if (!isKey(def.key)) continue;

			this.event.onKeyDown(def.key, () => this.controller.keyDown(key as keyof T & string));
			this.event.onKeyUp(def.key, () => this.controller.keyUp(key as keyof T & string));
		}
	}
}
