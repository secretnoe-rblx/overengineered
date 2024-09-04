import { ColorChooser } from "client/gui/ColorChooser";
import { Control } from "client/gui/Control";
import { Gui } from "client/gui/Gui";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { UnitTests } from "shared/test/TestFramework";

namespace ColorChooserTests {
	export function show() {
		const colorparent = Gui.getGameUI<{
			Templates: { Color: GuiObject & { Content: ColorChooserDefinition } };
		}>().Templates.Color.Clone();

		return new Control(colorparent)
			.withAdded(new ColorChooser(colorparent.Content))
			.with((c) => (c.instance.Position = new UDim2()))
			.with((c) => (c.instance.AnchorPoint = new Vector2()));
	}
}
export const _Tests: UnitTests = { ColorChooserTests };
