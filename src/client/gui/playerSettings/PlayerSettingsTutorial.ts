import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import { BasicCarTutorial } from "client/tutorial/tutorials/BasicCarTutorial";
import { NewBasicPlaneTutorial } from "client/tutorial/tutorials/NewBasicPlaneTutorial";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { SettingsPopup } from "client/gui/popup/SettingsPopup";
import type { TutorialDescriber } from "client/tutorial/TutorialController";
import type { TutorialsService } from "client/tutorial/TutorialService";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

@injectable
export class PlayerSettingsTutorial extends ConfigControlList {
	constructor(
		gui: ConfigControlListDefinition & ConfigControlTemplateList,
		value: ObservableValue<PlayerConfig>,
		@inject tutorialsService: TutorialsService,
		@inject di: DIContainer,
	) {
		super(gui);

		this.addCategory("Tutorial");
		{
			const run = (clazz: ConstructorOf<TutorialDescriber>) => {
				task.spawn(() => tutorialsService.run(di.resolveForeignClass(clazz)));
				di.resolve<SettingsPopup>().destroy();
			};

			this.addButton("Basic plane", () => run(NewBasicPlaneTutorial)) //
				.setDescription("Basic controls and mechanics");

			this.addButton("Basic car", () => run(BasicCarTutorial)) //
				.setDescription("Basic controls and mechanics");
		}
	}
}
