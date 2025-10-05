import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import { BasicCarTutorial } from "client/tutorial/tutorials/BasicCarTutorial";
import { BasicPlaneTutorial } from "client/tutorial/tutorials/BasicPlaneTutorial";
import { NewBasicPlaneTutorial } from "client/tutorial/tutorials/NewBasicPlaneTutorial";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";
import type { TutorialDescriber } from "client/tutorial/TutorialController";
import type { TutorialsService } from "client/tutorial/TutorialService";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

export class PlayerSettingsTutorial extends ConfigControlList {
	constructor(gui: ConfigControlListDefinition & ConfigControlTemplateList, value: ObservableValue<PlayerConfig>) {
		super(gui);

		this.$onInjectAuto((tutorialsService: TutorialsService, settingsPopup: SettingsPopup, di: DIContainer) => {
			this.addCategory("Tutorial");
			{
				const run = (clazz: ConstructorOf<TutorialDescriber>) => {
					task.spawn(() => tutorialsService.run(di.resolveForeignClass(clazz)));
					settingsPopup.destroy();
				};
				this.addButton("Basic plane", () => run(NewBasicPlaneTutorial)) //
					.setDescription("Basic controls and mechanics");
				this.addButton("Basic car", () => run(BasicCarTutorial)) //
					.setDescription("Basic controls and mechanics [2]");
				this.addButton("Basic plane (old)", () => run(BasicPlaneTutorial)) //
					.setDescription("Basic controls and mechanics but old");
			}
		});
	}
}
