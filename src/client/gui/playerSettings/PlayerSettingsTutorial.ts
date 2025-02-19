import { ConfigControlList } from "client/gui/configControls/ConfigControlsList";
import type {
	ConfigControlListDefinition,
	ConfigControlTemplateList,
} from "client/gui/configControls/ConfigControlsList";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

@injectable
export class PlayerSettingsTutorial extends ConfigControlList {
	constructor(
		gui: ConfigControlListDefinition & ConfigControlTemplateList,
		value: ObservableValue<PlayerConfig>,
		// @inject tutorialsService: TutorialsService,
		@inject di: DIContainer,
	) {
		super(gui);

		this.addCategory("Tutorial; (disabled for the time being)");
		{
			// const run = (clazz: ConstructorOf<TutorialDescriber>) => {
			// 	task.spawn(() => tutorialsService.run(di.resolveForeignClass(clazz)));
			// 	di.resolve<SettingsPopup>().destroy();
			// };
			// this.addButton("Basic plane", () => run(NewBasicPlaneTutorial)) //
			// 	.setDescription("Basic controls and mechanics");
			// this.addButton("Basic car", () => run(BasicCarTutorial)) //
			// 	.setDescription("Basic controls and mechanics");
		}
	}
}
