import { Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { Objects } from "engine/shared/fixes/Objects";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { PlayerDatabaseData } from "server/database/PlayerDatabase";

@injectable
export class PlayerDataController extends HostedService {
	constructor(@inject private readonly players: PlayerDatabase) {
		super();

		this.event.subscribe(CustomRemotes.player.updateSettings.invoked, this.updateSetting.bind(this));
		this.event.subscribe(CustomRemotes.player.updateData.invoked, this.updateData.bind(this));
		CustomRemotes.player.fetchData.subscribe(this.fetchSettings.bind(this));

		Workspace.AddTag("data_loadable");
	}

	private updateSetting(player: Player, config: PlayerUpdateSettingsRequest): Response {
		const playerData = this.players.get(player.UserId);

		const newPlayerData: PlayerDatabaseData = {
			...playerData,
			settings: Objects.deepCombine(playerData.settings ?? {}, config),
		};

		this.players.set(player.UserId, newPlayerData);
		return {
			success: true,
		};
	}
	private updateData(player: Player, { key, value }: PlayerUpdateDataRequest): Response {
		const playerData = this.players.get(player.UserId);

		const newPlayerData: PlayerDatabaseData = {
			...playerData,
			data: {
				...(playerData.data ?? {}),
				[key]: value,
			},
		};

		this.players.set(player.UserId, newPlayerData);
		return {
			success: true,
		};
	}
	private fetchSettings(player: Player): Response<PlayerDataResponse> {
		const data = this.players.get(player.UserId) ?? {};

		return {
			success: true,
			purchasedSlots: data.purchasedSlots,
			settings: data.settings,
			slots: data.slots,
			data: data.data,
		};
	}
}
