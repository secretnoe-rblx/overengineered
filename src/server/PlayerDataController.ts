import { HttpService, Workspace } from "@rbxts/services";
import { Backend } from "server/Backend";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { HostedService } from "shared/GameHost";
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

	private updateSetting(player: Player, { key, value }: PlayerUpdateSettingsRequest): Response {
		const playerData = this.players.get(player.UserId);

		const newPlayerData: PlayerDatabaseData = {
			...playerData,
			settings: {
				...(playerData.settings ?? {}),
				[key]: value,
			},
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

		const universeId = GameDefinitions.isTestPlace()
			? GameDefinitions.PRODUCTION_UNIVERSE_ID
			: GameDefinitions.INTERNAL_UNIVERSE_ID;

		const slots: SlotMeta[] = [];

		if (GameDefinitions.isTester(player) || GameDefinitions.isTestPlace()) {
			try {
				const externalData = HttpService.JSONDecode(
					Backend.Datastores.GetEntry(universeId, "players", tostring(player.UserId)) as string,
				);

				const externalSlots = (externalData as { slots: readonly SlotMeta[] | undefined })?.slots;
				if (externalSlots) {
					for (const slot of externalSlots) {
						if (slot.blocks > 0) {
							slots.push(slot);
						}
					}
				}
			} catch (err) {
				$err("Error while loading the external slots:", err, "skipping...");
			}
		}

		return {
			success: true,
			purchasedSlots: data.purchasedSlots,
			settings: data.settings,
			slots: data.slots,
			imported_slots: slots,
			data: data.data,
		};
	}
}
