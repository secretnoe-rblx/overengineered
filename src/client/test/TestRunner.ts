import { Interface } from "client/gui/Interface";
import { TestsUI } from "client/test/TestsUI";
import type { TestsUIDefinition } from "client/test/TestsUI";

export namespace TestRunner {
	let destroy: (() => void) | undefined;
	export function create(di: DIContainer) {
		const ui = di.resolveForeignClass(TestsUI, [
			Interface.getPlayerGui<{ Tests: TestsUIDefinition }>().Tests.Clone(),
		]);
		ui.instance.Parent = Interface.getPlayerGui();

		ui.enable();
		destroy = () => {
			destroy = undefined;
			ui.destroy();
		};
	}
}
