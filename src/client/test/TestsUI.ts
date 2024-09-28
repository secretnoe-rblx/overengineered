import { TextButtonControl } from "client/gui/controls/Button";
import { Control } from "engine/client/gui/Control";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { TestFramework } from "engine/shared/TestFramework";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { UnitTest } from "engine/shared/TestFramework";

export type TestsUIDefinition = ScreenGui & {
	readonly TestList: GuiObject & {
		readonly Template: TextButtonDefinition;
	};
	readonly SubTestList: GuiObject & {
		readonly Template: TextButtonDefinition;
	};
	readonly Content: GuiObject;
};

@injectable
export class TestsUI extends InstanceComponent<TestsUIDefinition> {
	constructor(gui: TestsUIDefinition, @inject di: DIContainer) {
		super(gui);

		this.onEnable(() => (gui.Enabled = true));
		this.onDisable(() => (gui.Enabled = false));

		const testButtonTemplate = this.asTemplate(gui.TestList.Template);
		const subTestButtonTemplate = this.asTemplate(gui.SubTestList.Template);

		const ctestList = this.add(new Control(gui.TestList));
		const csubTestList = this.add(new Control(gui.SubTestList));
		const ccontent = this.add(new Control(gui.Content));

		//

		type Test = { readonly name: string; test: UnitTest };
		const testListList: { [k in string]: Test[] } = {};

		for (const testScript of TestFramework.findAllTestScripts()) {
			for (const [k, tests] of pairs(TestFramework.loadTestsFromScript(testScript))) {
				const list = (testListList[k] ??= []);

				for (const [k, test] of pairs(tests)) {
					list.push({ name: k, test });
				}
			}
		}

		const filterTestName = (name: string) => {
			if (name.sub(-"Tests".size()) === "Tests") {
				name = name.sub(1, -"Tests".size() - 1);
			}

			return name;
		};
		for (const [testListName, testList] of pairs(testListList)) {
			const clicked = () => {
				csubTestList.clear();
				ccontent.clear();

				for (const { name: testName, test } of testList) {
					const clicked = () => {
						ccontent.clear();

						const result = TestFramework.run(`${testListName}>${testName}`, test, di);
						if (result && typeIs(result, "table") && result instanceof Control) {
							ccontent.add(result);
						}
					};

					const btn = csubTestList.add(new TextButtonControl(subTestButtonTemplate(), clicked));
					btn.text.set(filterTestName(testName));
				}
			};

			const btn = ctestList.add(new TextButtonControl(testButtonTemplate(), clicked));
			btn.text.set(filterTestName(testListName));
		}
	}
}
