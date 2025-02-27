import { ConfigControlEdit } from "client/gui/configControls/ConfigControlEdit";
import { MemoryEditorPopup } from "client/gui/popup/MemoryEditorPopup";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import type { ConfigControlEditDefinition } from "client/gui/configControls/ConfigControlEdit";
import type { PopupController } from "client/gui/PopupController";

@injectable
export class ConfigControlByteArray extends ConfigControlEdit<readonly number[]> {
	@inject private readonly popupController: PopupController = undefined!;

	constructor(gui: ConfigControlEditDefinition, name: string, lengthLimit: number) {
		super(gui, name, () => {
			const c = new MemoryEditorPopup(lengthLimit, [...v.get()], (v) => this.submit(this.multiMap(() => v)));
			this.popupController.showPopup(c);
		});

		const v = new ObservableValue<readonly number[]>([]);
		v.subscribe((v) => {
			const preview: number[] = [];
			for (let i = 0; i < math.min(v.size(), 8); i++) {
				preview[i] = v[i];
			}

			gui.Buttons.Preview.Text = preview.map((b) => string.format("%02X ", b)).join(" ");
		});

		this.initFromMultiWithDefault(v, () => []);
	}
}
