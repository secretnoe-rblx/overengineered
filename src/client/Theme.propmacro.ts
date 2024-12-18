import type { Theme, ThemeColorKey } from "client/Theme";
import type { InstanceComponent } from "engine/shared/component/InstanceComponent";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";

// function to force hoisting of the macros, because it does not but still tries to use them
// do NOT remove and should ALWAYS be before any other code
const _ = () => [ThemeMacros];

//

declare module "engine/shared/component/InstanceComponent" {
	interface InstanceComponent<T extends Instance> {
		themeButton(
			this: InstanceComponent<GuiButton>,
			theme: Theme,
			key: ThemeColorKey | ReadonlyObservableValue<ThemeColorKey>,
		): this;
	}
}
export const ThemeMacros: PropertyMacros<InstanceComponent<GuiButton>> = {
	themeButton: (selv, theme, key) => {
		if (typeIs(key, "table")) {
			key.subscribe((key) => selv.themeButton(theme, key), true);
		} else {
			selv.overlayValue("BackgroundColor3", theme.get(key));
		}

		return selv;
	},
};
