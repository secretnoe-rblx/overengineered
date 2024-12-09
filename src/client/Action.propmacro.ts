import { TooltipsHolder } from "client/gui/static/TooltipsControl";
import type { Action } from "engine/client/Action";
import type { KeybindRegistration } from "engine/client/Keybinds";
import type { Component } from "engine/shared/component/Component";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ActionMacros];

//

declare module "engine/client/Action" {
	interface Action<TArgs extends unknown[]> extends Component {
		initKeybind(keybind: KeybindRegistration, config?: ActionKeybindConfig): void;
	}
}

export interface ActionKeybindConfig {
	readonly sink?: boolean;
	readonly priority?: number;
}
const defaultConfig: ActionKeybindConfig = {
	sink: true,
	priority: undefined,
};

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
