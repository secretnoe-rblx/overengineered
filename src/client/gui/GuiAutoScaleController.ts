import { Interface } from "client/gui/Interface";
import { ScaledScreenGui } from "client/gui/ScaledScreenGui";
import { HostedService } from "engine/shared/di/HostedService";
import type { PlayerDataStorage } from "client/PlayerDataStorage";

@injectable
export class GuiAutoScaleController extends HostedService {
	constructor(@inject playerData: PlayerDataStorage) {
		super();

		const scale = playerData.config.createBased((c) => c.uiScale);
		ScaledScreenGui.initializeGlobalScale(scale);

		this.parent(new ScaledScreenGui(Interface.getGameUI()));
		this.parent(new ScaledScreenGui(Interface.getPopupUI()));
	}
}
