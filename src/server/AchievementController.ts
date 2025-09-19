import { Players, RunService, TextChatService, UserInputService, Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { Strings } from "engine/shared/fixes/String.propmacro";
import { Achievement } from "server/Achievement";
import { LogicOverclockBlock } from "shared/blocks/blocks/LogicOverclockBlock";
import { BlockManager } from "shared/building/BlockManager";
import { CustomRemotes } from "shared/Remotes";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ServerPlayersController } from "server/ServerPlayersController";
import type { AchievementData } from "shared/AchievementData";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { FireEffect } from "shared/effects/FireEffect";
import type { PlayerDataStorageRemotesBuilding } from "shared/remotes/PlayerDataRemotes";

const init = (list: AchievementList, player: Player, data: { readonly [x: string]: AchievementData } | undefined) => {
	const achievements: readonly ConstructorOf<Achievement>[] = [
		AchievementWelcome,
		AchievementPlaytime,
		AchievementAfkTime,

		AchievementHeightRecord25k,
		AchievementHeightRecord75k,
		AchievementHeightRecord150k,

		AchievementSpeedRecord1k,
		AchievementSpeedRecord5k,
		AchievementSpeedRecord15k,
		AchievementSpeedRecord50k,
		AchievementSpeedRecord100k,

		AchievementCatchOnFire,

		AchievementTheIssue,
		AchievementOverclock,

		// map-specific ones
		AchievementCentrifuge30seconds,
		AchievementCentrifuge20seconds,
		AchievementCentrifuge10seconds,
		AchievementCentrifuge5seconds,
	];

	const instanced = achievements.map((ach) => {
		const instance = list.add(ach);
		instance.setData(data?.[instance.info.id]);
		print("loading achi data for ", player.Name, instance.info.id, ": ", Strings.pretty(data?.[instance.info.id]));

		return instance;
	});
	CustomRemotes.achievements.loaded.send(player, asObject(list.list.mapToMap((k, v) => $tuple(k, v.info))));
	for (const v of instanced) list.parent(v);
};

@injectable
class AchievementList extends HostedService {
	readonly list = new Map<string, Achievement>();

	constructor(private readonly player: Player) {
		super();
	}

	add<T extends Achievement>(achievement: ConstructorOf<T>) {
		const di = this.getDI().beginScope((builder) => builder.registerSingletonValue(this.player));

		const instance = di.resolveForeignClass(achievement);
		this.list.set(instance.info.id, instance);

		return instance;
	}
}

@injectable
export class AchievementController extends HostedService {
	constructor(@inject serverPlayersController: ServerPlayersController) {
		super();

		this.event.subscribe(CustomRemotes.playerLoaded.invoked, (player) => {
			const controller = serverPlayersController.controllers.get(player.UserId);
			if (!controller) return;

			const list = controller.parent(new AchievementList(controller.player));
			task.defer(() => {
				const database = serverPlayersController.players;
				const achdata = database.get(player.UserId).achievements;
				init(list, controller.player, achdata);

				// player update sending loop
				controller.event.loop(10, () => {
					const datas: { [k in string]: AchievementData } = {};
					for (const [id, achievement] of list.list) {
						const d = achievement.getChangesForRemote();
						if (!d) continue;

						datas[id] = d;
					}

					if (asMap(datas).isEmpty()) return;

					$log(`Sending to ${player.Name} achievement datas: ${Strings.pretty(asMap(datas).keys())}`);
					CustomRemotes.achievements.update.send(player, datas);
				});

				const flushDatabase = () => {
					const datas: { [k in string]: AchievementData } = {};
					for (const [id, achievement] of list.list) {
						const d = achievement.getChangesForDatabase();
						if (!d) continue;

						datas[id] = d;
					}

					if (asMap(datas).isEmpty()) return;

					$log(`Flushing of ${player.Name} achievement datas: ${Strings.pretty(asMap(datas).keys())}`);
					const pdata = database.get(player.UserId);
					database.set(player.UserId, {
						...pdata,
						achievements: { ...(pdata.achievements ?? {}), ...datas },
					});
				};

				// database flushing loop
				controller.event.loop(60, flushDatabase);
				controller.onDestroy(flushDatabase);
			});
		});
	}
}

type triggerInstances = Record<`trigger${number}`, BasePart>;
const _triggers = (
	Workspace as Workspace & {
		Triggers: {
			Centrifuge: Folder & triggerInstances;
		};
	}
).Triggers;

// DO NOT CHANGE! RETURNS SORTED ARRAY!
const getTriggerList = (n: keyof typeof _triggers) => {
	const tgs = _triggers[n];
	const rawlist = tgs.GetChildren() as (BasePart | UnionOperation)[];
	const list = [];
	for (let i = 0; i < rawlist.size(); i++) {
		const v = tgs.FindFirstChild(`trigger${i}`);
		if (!v) throw `Trigger init error: "trigger${i}" not found in triggers of ${n}`;
		list[i] = v as BasePart | UnionOperation;
	}

	const record = {} as triggerInstances;
	list.forEach((v) => (record[v.Name as `trigger${number}`] = v));
	return $tuple(list, record);
};

/*
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
	PLEASE DO NOT SPOIL THE ACHIEVEMENTS FOR OTHER PLAYERS!!!
*/

@injectable
class AchievementWelcome extends Achievement {
	constructor(@inject player: Player) {
		super(player, {
			id: "WELCOME",
			name: `Hi, ${player.Name}!`,
			description: `Welcome to OverEngineered!`,
		});

		this.onEnable(() => this.set({ completed: true }));
	}
}

@injectable
class AchievementTheIssue extends Achievement {
	constructor(@inject player: Player) {
		super(player, {
			id: "THE_ISSUE",
			name: "DMCA abuse",
			description: "Now go to our community server and read #the-issue channel",
		});

		this.event.subscribe(TextChatService.MessageReceived, (msg) => {
			if (msg.TextSource?.UserId !== player.UserId) return;
			this.set({ completed: msg.Text.fullLower().contains("plane crazy") });
		});
	}
}

@injectable
class AchievementPlaytime extends Achievement<{ seconds_spent: number }> {
	constructor(@inject player: Player) {
		//1 hour
		const target_seconds = 1 * 60 * 60;
		const target_hours = target_seconds / 60 / 60;
		super(player, {
			id: "SPEND_1_HOUR",
			name: `Spare time`,
			description: `Play for over ${target_hours} ${target_hours > 1 ? "hours" : "hour"} in total`,
		});

		let seconds_spent = this.getData()?.seconds_spent ?? 0;
		this.event.subscribe(RunService.Heartbeat, (delta) => {
			seconds_spent += delta;
			this.set({ completed: seconds_spent > target_seconds, seconds_spent });
		});
	}
}

@injectable
class AchievementAfkTime extends Achievement<{ seconds_record: number }> {
	constructor(@inject player: Player) {
		//15 minutes
		const target_seconds = 15 * 60;
		const target_minutes = target_seconds / 60;
		super(player, {
			id: "BE_AFK_15_MINUTES",
			name: `DON'T TOUCH ANYTHING!`,
			description: `Be AFK for ${target_minutes} minutes`,
			hidden: true,
		});

		let seconds_record = this.getData()?.seconds_record ?? 0;
		this.event.subscribe(UserInputService.InputBegan, () => (seconds_record = 0));

		this.event.subscribe(RunService.Heartbeat, (delta) => {
			seconds_record += delta;
			this.set({ completed: seconds_record > target_seconds, seconds_record });
		});
	}
}

abstract class AchievementHeightRecord extends Achievement<{ height_record: number }> {
	constructor(player: Player, name: string, description: string, targetHeight: number) {
		super(player, {
			id: `HEIGHT_TARGET_${targetHeight}`,
			name,
			description: `${description} (${targetHeight} studs traveled)`,
		});

		let height_record = this.getData()?.height_record ?? 0;
		this.event.subscribe(RunService.Heartbeat, () => {
			const character = player.Character?.PrimaryPart;
			if (!character) return;

			height_record = math.max(character.Position.Y, height_record);
			this.set({ completed: height_record > targetHeight, height_record });
		});
	}
}

@injectable
class AchievementHeightRecord25k extends AchievementHeightRecord {
	constructor(@inject player: Player) {
		super(player, `Space tourism`, `Leave the atmosphere`, 25_000);
	}
}

@injectable
class AchievementHeightRecord75k extends AchievementHeightRecord {
	constructor(@inject player: Player) {
		super(player, `SPAAAAACE`, `Deeper into the void!`, 75_000);
	}
}

@injectable
class AchievementHeightRecord150k extends AchievementHeightRecord {
	constructor(@inject player: Player) {
		super(player, `Deepfried space`, `Things are wobbly over here`, 150_000);
	}
}

abstract class AchievementSpeedRecord extends Achievement<{ time_record: number }> {
	constructor(player: Player, name: string, targetSpeed: number, hidden = false) {
		super(player, {
			id: `SPEED_TARGET_${targetSpeed}`,
			name: name,
			description: `Reach speed over ${targetSpeed} studs/second in horizontal axis for 3 seconds`,
			hidden,
		});

		let time_record = this.getData()?.time_record ?? 0;
		let counter = 0;
		this.event.subscribe(RunService.Heartbeat, (delta) => {
			const character = player.Character?.PrimaryPart;
			if (!character) return (counter = 0);

			//exclude Y axis becuase it can be abused by helium and other things
			// should angular velocity really be included? I dunno
			const speed = character.AssemblyLinearVelocity.apply((v, a) => (a === "Y" ? 0 : v)).add(
				character.AssemblyAngularVelocity,
			).Magnitude;

			if (speed < targetSpeed) return (counter = 0);

			time_record = math.max((counter += delta), time_record);
			this.set({ completed: counter > 3, time_record });
		});
	}
}

@injectable
class AchievementSpeedRecord1k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `A bit fast, eh?`, 1000);
	}
}

@injectable
class AchievementSpeedRecord5k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `4.114 Machs doesn't sound like a lot`, 5000);
	}
}

@injectable
class AchievementSpeedRecord15k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `BRO WHERE ARE WE GOING?!`, 15_000, true);
	}
}

@injectable
class AchievementSpeedRecord50k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `Typical High Speed Fan`, 50_000, true);
	}
}

@injectable
class AchievementSpeedRecord100k extends AchievementSpeedRecord {
	constructor(@inject player: Player) {
		super(player, `Lightspeed Enjoyer`, 150_000, true);
	}
}

@injectable
class AchievementCatchOnFire extends Achievement {
	constructor(@inject player: Player, @inject @inject fireffect: FireEffect) {
		super(player, {
			id: "CATCH_ON_FIRE",
			name: "OverCooked!",
			description: "Better call the fire department! (We don't have one)",
		});

		this.event.subscribe(fireffect.event.c2s.invoked, (owner) => this.set({ completed: owner === player }));
	}
}

@injectable
class AchievementOverclock extends Achievement {
	constructor(
		@inject player: Player,
		@inject playModeController: PlayModeController,
		@inject plots: SharedPlots,
		@inject plot: PlayerDataStorageRemotesBuilding,
	) {
		super(player, {
			id: "USE_OVERCLOCK",
			name: "OverClocked!",
			description: "What's that noise? OHHH MY PC",
		});

		let hasOverClock = false;
		this.event.subscribe(Players.PlayerRemoving, (p) => {
			if (p !== player) return;
			hasOverClock = false;
		});

		this.event.subscribe(plot.placeBlocks.processed, (player, a, b) => {
			const id = plots.getPlotComponent(a.plot).ownerId.get();
			if (!id) return;

			const p = Players.GetPlayerByUserId(id);
			if (p !== player) return;

			for (const m of b.models) {
				if (BlockManager.manager.id.get(m) === LogicOverclockBlock.id) {
					hasOverClock = true;
					return;
				}
			}
		});

		this.event.subscribe(plot.deleteBlocks.processed, (player, a, b) => {
			const id = plots.getPlotComponent(a.plot).ownerId.get();
			if (!id) return;

			if (a.blocks === "all") {
				hasOverClock = false;
				return;
			}

			const p = Players.GetPlayerByUserId(id);
			if (p !== player) return;

			for (const m of a.blocks) {
				if (BlockManager.manager.id.get(m) === LogicOverclockBlock.id) {
					hasOverClock = false;
					return;
				}
			}
		});

		this.event.subscribe(CustomRemotes.modes.setOnClient.sent, () => {
			const mode = playModeController.getPlayerMode(player);
			if (mode !== "ride") return;

			this.set({ completed: hasOverClock });
		});
	}
}

abstract class AchievementCentrifuge extends Achievement {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		name: string,
		timeout_seconds: number,
		hidden = false,
	) {
		super(player, {
			id: `CENTRIFUGE_TARGET_${timeout_seconds}`,
			name,
			description: `Make a lap in the Centrifuge in ${timeout_seconds} seconds or less`,
			hidden,
		});

		const hitSequence: (BasePart | undefined)[] = [];
		const [triggersList, triggersRecord] = getTriggerList("Centrifuge");
		const listLen = triggersList.size();
		for (let i = 0; i < listLen; i++) {
			const t = triggersList[i];
			let thread: thread;

			this.event.subscribe(t.Touched, (inst) => {
				//get player's mode
				// yes it DOESN'T actually check if player is in their own vehicle
				// but it doesn't matter because player doesn't know it
				if (playModeController.getPlayerMode(player) !== "ride") return;

				//check if part touched is player's
				if (inst.Parent !== player.Character) return;

				//add timeout to the trigger
				hitSequence[i] = t;
				if (thread) task.cancel(thread);
				thread = task.delay(timeout_seconds, () => (hitSequence[i] = undefined));

				//check if all triggered
				let allTriggered = true;
				for (let j = 0; j < listLen; j++) {
					const tr = hitSequence[j];
					if (tr === undefined) {
						allTriggered = false;
						break;
					}
				}

				this.set({ completed: allTriggered });
			});
		}
	}
}

@injectable
class AchievementCentrifuge30seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `30 Seconds or Less`, 30);
	}
}

@injectable
class AchievementCentrifuge20seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `Now We're Cooking with Gas!`, 20);
	}
}

@injectable
class AchievementCentrifuge10seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `Right round like a record, baby`, 10);
	}
}

@injectable
class AchievementCentrifuge5seconds extends AchievementCentrifuge {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, `KA-CHOW`, 5, true);
	}
}
