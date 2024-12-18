import { Players } from "@rbxts/services";
import { Db } from "engine/server/Database";
import { JSON } from "engine/shared/fixes/Json";
import { PlayerConfigUpdater } from "server/PlayerConfigVersioning";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

const localPlayersData: { readonly [k in number]?: PlayerDatabaseData } = {
	// hyprlandd
	7667688305: {
		settings: {
			uiScale: 0.75,
			sprintSpeed: 200,
			ragdoll: {
				autoFall: true,
				autoRecovery: true,
				triggerByKey: true,
				triggerKey: "X",
			},
		},
	},
};

export type PlayerDatabaseData = {
	readonly purchasedSlots?: number;
	readonly settings?: Partial<PlayerConfig>;
	readonly slots?: readonly SlotMeta[];
	readonly data?: Partial<PlayerData>;
};

export class PlayerDatabase {
	private readonly onlinePlayers = new Set<number>();
	private readonly datastore: DatabaseBackend;
	private readonly db;

	constructor() {
		this.datastore = Db.createStore("players");

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
		if (game.PlaceId === 0) {
			const data = localPlayersData[userId];
			if (data) return data;
		}

		return this.db.get(tostring(userId));
	}

	set(userId: number, data: PlayerDatabaseData) {
		this.db.set(tostring(userId), data);

		if (!this.onlinePlayers.has(userId)) {
			this.db.save(tostring(userId));
		}
	}
}
