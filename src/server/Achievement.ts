import { Component } from "engine/shared/component/Component";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { AchievementData } from "shared/AchievementData";

export type baseAchievementStats = {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	readonly imageURL?: string;
	readonly hidden?: boolean;
	readonly visualizationType?: "NONE" | "PROGRESS_BAR" | "NUMBER";
};

@injectable
export abstract class Achievement<Z = {}, T extends Z & AchievementData = Z & AchievementData> extends Component {
	@inject private readonly database: PlayerDatabase = undefined!;
	private data?: T;

	constructor(
		private readonly player: Player,
		readonly info: baseAchievementStats,
	) {
		super();
	}

	getData(): T | undefined {
		if (this.data) return this.data;
		const pdata = this.database.get(this.player.UserId);

		// loading from database takes time, and some achievements can trigger set() multiple times during fetching
		// if, after loading, we already have a loaded data, then we just return it, otherwise we end up using old data
		if (this.data) return this.data;

		const achievements = pdata.achievements;
		if (!achievements || !(this.info.id in achievements)) return;

		return (this.data = achievements[this.info.id] as T);
	}

	set(data: T) {
		if (this.getData()?.completed) return;

		(data as Writable<T>).completionDateUnix = DateTime.now().UnixTimestamp;
		this.data = data;

		const pdata = this.database.get(this.player.UserId);
		this.database.set(this.player.UserId, {
			...pdata,
			achievements: { ...(pdata.achievements ?? {}), [this.info.id]: data },
		});
		CustomRemotes.achievementUpdated.send(this.player, { id: this.info.id, data });
	}
}
