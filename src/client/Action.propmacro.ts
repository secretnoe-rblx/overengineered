import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import type { Action } from "engine/client/Action";
import type { HoldAction } from "engine/client/HoldAction";
import type { KeybindRegistration } from "engine/client/Keybinds";
import type { Component } from "engine/shared/component/Component";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ActionMacros, HoldActionMacros];

//

export interface ActionKeybindConfig {
	readonly sink?: boolean;
	readonly priority?: number;
}
const defaultConfig: ActionKeybindConfig = {
	sink: true,
	priority: undefined,
};

declare module "engine/client/Action" {
	interface Action<TArgs extends unknown[]> extends Component {
		initKeybind(keybind: KeybindRegistration, config?: ActionKeybindConfig): void;
	}
}
export const ActionMacros: PropertyMacros<Action> = {
	initKeybind: (selv: Action, keybind: KeybindRegistration, config?: ActionKeybindConfig): void => {
		const tooltip = selv.parentDestroyOnly(TooltipsHolder.createComponent(keybind.displayPath[0]));
		tooltip.setFromKeybinds(keybind);
		selv.canExecute.subscribe((enabled) => tooltip.setEnabled(enabled));
		selv.event.subscribeRegistration(() =>
			keybind.onDown(() => {
				selv.execute();
				return (config?.sink ?? defaultConfig.sink) ? "Sink" : "Pass";
			}, config?.priority ?? defaultConfig.priority),
		);
	},
};

declare module "engine/client/HoldAction" {
	interface HoldAction extends Component {
		initKeybind(keybind: KeybindRegistration, config?: ActionKeybindConfig): void;
	}
}
export const HoldActionMacros: PropertyMacros<HoldAction> = {
	initKeybind: (selv: HoldAction, keybind: KeybindRegistration, config?: ActionKeybindConfig): void => {
		const tooltip = selv.parentDestroyOnly(TooltipsHolder.createComponent(keybind.displayPath[0]));
		tooltip.setFromKeybinds(keybind);
		selv.canExecute.subscribe((enabled) => tooltip.setEnabled(enabled));

		const ret = (config?.sink ?? defaultConfig.sink) ? "Sink" : "Pass";
		const priority = config?.priority ?? defaultConfig.priority;
		selv.event.subscribeRegistration(() => [
			keybind.onDown(() => {
				selv.set(true);
				return ret;
			}, priority),
			keybind.onUp(() => {
				selv.set(false);
				return ret;
			}, priority),
		]);
		selv.onEnable(() => {
			if (keybind.isPressed.get()) {
				selv.set(true);
			}
		});
	},
};
