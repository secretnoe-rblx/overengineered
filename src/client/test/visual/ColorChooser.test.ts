import { ColorChooser } from "client/gui/ColorChooser";
import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import type { ColorChooserDefinition } from "client/gui/ColorChooser";
import type { UnitTests } from "engine/shared/TestFramework";

namespace ColorChooserTests {
	export function show() {
		const colorparent = Interface.getGameUI<{
			Templates: { Color: GuiObject & { Content: ColorChooserDefinition } };
		}>().Templates.Color.Clone();

		return new Control(colorparent)
			.withParented(new ColorChooser(colorparent.Content))
			.with((c) => (c.instance.Position = new UDim2()))
			.with((c) => (c.instance.AnchorPoint = new Vector2()));
	}
}
export const _Tests: UnitTests = { ColorChooserTests };
