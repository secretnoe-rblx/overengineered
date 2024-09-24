import { DataStoreService, Players } from "@rbxts/services";
import { Db } from "server/database/Database";
import { PlayerConfigUpdater } from "server/PlayerConfigVersioning";
import { JSON } from "shared/fixes/Json";

export type PlayerDatabaseData = {
	readonly purchasedSlots?: number;
	readonly settings?: Partial<PlayerConfig>;
	readonly slots?: readonly SlotMeta[];
	readonly data?: Partial<PlayerData>;
};

export class PlayerDatabase {
	private readonly onlinePlayers = new Set<number>();
	private readonly datastore;
	private readonly db;

	constructor() {
		try {
			this.datastore = DataStoreService.GetDataStore("players");
		} catch {
			warn("Place datastore is not available. All requests will be dropped.");
		}

		this.db = new Db<PlayerDatabaseData>(
			this.datastore,
			() => ({}),
			(data) => JSON.serialize(data),
			(data) => {
				const pdata = JSON.deserialize<PlayerDatabaseData>(data);
				return {
					...pdata,
					settings: pdata.settings === undefined ? undefined : PlayerConfigUpdater.update(pdata.settings),
				};
			},
		);

		Players.PlayerAdded.Connect((plr) => this.onlinePlayers.add(plr.UserId));
		Players.PlayerRemoving.Connect((plr) => {
			this.onlinePlayers.delete(plr.UserId);

			// Roblox Stuido Local Server
			if (plr.UserId <= 0) return;

			const key = tostring(plr.UserId);
			this.db.save(key);
			this.db.free(key);
		});
	}

	get(userId: number) {
		return this.db.get(tostring(userId));
	}

	set(userId: number, data: PlayerDatabaseData) {
		this.db.set(tostring(userId), data);

		if (!this.onlinePlayers.has(userId)) {
			this.db.save(tostring(userId));
		}
	}
}
