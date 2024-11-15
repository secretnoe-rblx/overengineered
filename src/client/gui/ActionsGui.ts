import { Gui } from "client/gui/Gui";
import { TextButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { Component } from "engine/shared/component/Component";
import type { HideInterfaceController } from "client/gui/HideInterfaceController";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

@injectable
class Starter extends Component {
	constructor(@inject di: DIContainer) {
		super();

		const gui = Gui.getGameUI<{ Action: ActionsGuiDefinition }>().Action;
		this.parentGui(di.resolveForeignClass(ActionsGui, [gui]));
	}
}

export type ActionsGuiDefinition = GuiObject & {
	readonly Hide: TextButton;
};
@injectable
export class ActionsGui extends Control<ActionsGuiDefinition> {
	static initialize(host: GameHostBuilder) {
		host.services.registerService(Starter);
	}

	constructor(gui: ActionsGuiDefinition, @inject hideInterfaceController: HideInterfaceController) {
		super(gui);

		this.add(new TextButtonControl(gui.Hide, () => hideInterfaceController.visible.set(false)));
	}
}
