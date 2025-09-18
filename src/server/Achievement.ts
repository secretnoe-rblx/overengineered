import { Component } from "engine/shared/component/Component";
import { CustomRemotes } from "shared/Remotes";
import type { AchievementData } from "shared/AchievementData";

export type baseAchievementStats = {
	readonly id: string;
	readonly name: string;
	readonly description: string;
	readonly imageURL?: string;
	readonly hidden?: boolean;
	readonly visualizationType?: "NONE" | "PROGRESS_BAR" | "NUMBER";
};

export abstract class Achievement<Z = {}, T extends Z & AchievementData = Z & AchievementData> extends Component {
	private data?: T;

	constructor(
		private readonly player: Player,
		readonly info: baseAchievementStats,
	) {
		super();
	}

	/** @deprecated @hidden Internal usage only */
	setData(data: T | undefined) {
		this.data = data;
	}

	private remotechanged = false;
	getChangesForRemote(): T | undefined {
		if (!this.remotechanged) return;
		this.remotechanged = false;

		return this.data;
	}

	private dbchanged = false;
	getChangesForDatabase(): T | undefined {
		if (!this.dbchanged) return;
		this.dbchanged = false;

		return this.data;
	}

	getData(): T | undefined {
		return this.data;
	}

	set(data: T) {
		if (this.getData()?.completed) return;

		if (data.completed) {
			(data as Writable<T>).completionDateUnix = DateTime.now().UnixTimestamp;
		}
		this.data = data;
		this.dbchanged = this.remotechanged = true;

		// const pdata = this.database.get(this.player.UserId);
		// this.database.set(this.player.UserId, {
		// 	...pdata,
		// 	achievements: { ...(pdata.achievements ?? {}), [this.info.id]: data },
		// });

		// send update immediately if completed
		if (data.completed) {
			CustomRemotes.achievements.update.send(this.player, { [this.info.id]: data });
		}
	}

	/** Shorthand for `this.set` with `data.completed = true` */
	complete(data: Omit<T, "completed" | "completionDateUnix">) {
		(data as Writable<T>).completed = true;
		this.set(data as T);
	}
}
