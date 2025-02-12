import { Players } from "@rbxts/services";
import { Db } from "engine/server/Database";
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
	private readonly db;

	constructor(private readonly datastore: DatabaseBackend<PlayerDatabaseData, [id: number]>) {
		this.db = new Db<PlayerDatabaseData, [id: number]>(this.datastore, () => ({}));

		Players.PlayerAdded.Connect((plr) => this.onlinePlayers.add(plr.UserId));
		Players.PlayerRemoving.Connect((plr) => {
			this.onlinePlayers.delete(plr.UserId);

			// Roblox Stuido Local Server
			if (plr.UserId <= 0) return;

			this.db.save([plr.UserId]);
			this.db.free([plr.UserId]);
		});
	}

	get(userId: number) {
		if (game.PlaceId === 0) {
			const data = localPlayersData[userId];
			if (data) return data;
		}

		const data = this.db.get([userId]);
		return {
			...data,
			settings: data.settings === undefined ? undefined : PlayerConfigUpdater.update(data.settings),
		};
	}

	set(userId: number, data: PlayerDatabaseData) {
		this.db.set([userId], data);

		if (!this.onlinePlayers.has(userId)) {
			this.db.save([userId]);
		}
	}
}
