import { Gui } from "client/gui/Gui";
import { TestsUI } from "client/test/TestsUI";
import type { TestsUIDefinition } from "client/test/TestsUI";

export namespace TestRunner {
	let destroy: (() => void) | undefined;
	export function create(di: DIContainer) {
		const ui = di.resolveForeignClass(TestsUI, [Gui.getPlayerGui<{ Tests: TestsUIDefinition }>().Tests.Clone()]);
		ui.instance.Parent = Gui.getPlayerGui();

		ui.enable();
		destroy = () => {
			destroy = undefined;
			ui.destroy();
		};
	}
}
