import { Players, RunService, TextChatService, UserInputService, Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { Strings } from "engine/shared/fixes/String.propmacro";
import { Achievement } from "server/Achievement";
import { LogicOverclockBlock } from "shared/blocks/blocks/LogicOverclockBlock";
import { LuaCircuitBlock } from "shared/blocks/blocks/LuaCircuitBlock";
import { BlockManager } from "shared/building/BlockManager";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { CustomRemotes } from "shared/Remotes";
import type { baseAchievementStats } from "server/Achievement";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { PlayModeController } from "server/modes/PlayModeController";
import type { ServerPlayerController } from "server/ServerPlayerController";
import type { ServerPlayersController } from "server/ServerPlayersController";
import type { AchievementData } from "shared/AchievementData";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { FireEffect } from "shared/effects/FireEffect";
import type { PlayerDataStorageRemotesBuilding } from "shared/remotes/PlayerDataRemotes";

const init = (list: AchievementList, player: Player, data: { readonly [x: string]: AchievementData } | undefined) => {
	const achievements: readonly ConstructorOf<Achievement>[] = [
		AchievementWelcome,
		AchievementLuaCircuitObtained,
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
		AchievementFOVMax,

		// map-specific ones
		AchievementBreakSomething,
		AchievementFindBanana,
		AchievementFindUFO,

		AchievementCentrifuge30seconds,
		AchievementCentrifuge20seconds,
		AchievementCentrifuge10seconds,
		AchievementCentrifuge5seconds,

		AchievementAmogusTrack20seconds,
		AchievementAmogusTrack15seconds,
		AchievementAmogusTrack10seconds,

		AchievementOvalTrack20seconds,
		AchievementOvalTrack15seconds,
		AchievementOvalTrack10seconds,

		AchievementAirRingsEasy,
		AchievementAirRingsMedium,
		AchievementAirRingsHard,
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

type triggerInstances = Folder & Record<`trigger${number}`, BasePart>;

const ws = Workspace as Workspace & {
	Triggers: {
		Centrifuge: triggerInstances;
		AmogusTrack: triggerInstances;
		AirRingsEasy: triggerInstances;
		AirRingsMedium: triggerInstances;
		AirRingsHard: triggerInstances;
		OvalTrack: triggerInstances;
	};
	Map: Folder & {
		Banana: Model;
		UFO: Model;
		"Main Island": {
			Fun: {
				Destructibles: Folder;
			};
		};
	};
};

const _triggers = ws.Triggers;

//make triggers invisible on run
for (const f of Workspace.FindFirstChild("Triggers")!.GetChildren()) {
	f.GetChildren().forEach((v) => ((v as BasePart).Transparency = 1));
}

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
class AchievementLuaCircuitObtained extends Achievement {
	constructor(@inject player: Player, @inject playerDatabase: PlayerDatabase) {
		super(player, {
			id: "LUA_CIRCUIT",
			name: "Oh yeah, it's big brain time",
			description: `Obtain ${LuaCircuitBlock.displayName} by joining our community server and following instructions there.`,
		});

		this.onEnable(() =>
			this.set({ completed: (playerDatabase.get(player.UserId).features?.indexOf("lua_circuit") ?? 0) > 0 }),
		);
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

			height_record = math.max(character.Position.Y - GameDefinitions.HEIGHT_OFFSET, height_record);
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
	constructor(@inject player: Player, @inject fireffect: FireEffect) {
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

abstract class AchievementCheckpoints extends Achievement<{ checkpoints_finished: string[] }> {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		data: baseAchievementStats,
		triggerGroup: keyof typeof _triggers,
	) {
		super(player, data);

		const checkpoints_finished = new Set(this.getData()?.checkpoints_finished ?? []);
		const hitSequence: (BasePart | undefined)[] = [];
		const [triggersList, triggersRecord] = getTriggerList(triggerGroup);
		const listLen = triggersList.size();
		for (let i = 0; i < listLen; i++) {
			const t = triggersList[i];

			this.event.subscribe(t.Touched, (inst) => {
				//get player's mode
				// yes it DOESN'T actually check if player is in their own vehicle
				// but it doesn't matter because player doesn't know it
				if (playModeController.getPlayerMode(player) !== "ride") return;

				//check if part touched is player's
				if (inst.Parent !== player.Character) return;

				//add timeout to the trigger
				hitSequence[i] = t;
				checkpoints_finished.add(t.Name);

				//check if all triggered
				let allTriggered = true;
				for (let j = 0; j < listLen; j++) {
					const tr = hitSequence[j];

					if (tr === undefined) {
						allTriggered = false;
						break;
					}
				}

				this.set({ completed: allTriggered, checkpoints_finished: [...checkpoints_finished] });
			});
		}
	}
}

abstract class AchievementCheckpointsWithTimeout extends Achievement {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		data: baseAchievementStats,
		timeout_seconds: number,
		triggerGroup: keyof typeof _triggers,
	) {
		super(player, data);

		const hitSequence: (BasePart | undefined)[] = [];
		const [triggersList, triggersRecord] = getTriggerList(triggerGroup);
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

abstract class AchievementCentrifuge extends AchievementCheckpointsWithTimeout {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		name: string,
		timeout_seconds: number,
		hidden = false,
	) {
		super(
			player,
			playModeController,
			{
				id: `CENTRIFUGE_TARGET_${timeout_seconds}`,
				name,
				description: `Make a lap in the Centrifuge in ${timeout_seconds} seconds or less`,
				hidden,
			},
			timeout_seconds,
			"Centrifuge",
		);
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

abstract class AchievementAmogusTrack extends AchievementCheckpointsWithTimeout {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		timeout_seconds: number,
		name: string,
		hidden = false,
		description = `Make a lap on the race track in ${timeout_seconds} seconds or less. No shortcut.`,
	) {
		super(
			player,
			playModeController,
			{
				id: `RACE_TRACK_TARGET_${timeout_seconds}`,
				name,
				description,
				hidden,
			},
			timeout_seconds,
			"AmogusTrack",
		);
	}
}

@injectable
class AchievementAmogusTrack20seconds extends AchievementAmogusTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 20, `Minimum Viable Product`, false, `Just running a lap is a solution too`);
	}
}

@injectable
class AchievementAmogusTrack15seconds extends AchievementAmogusTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 15, `Circuit Breaker`);
	}
}

@injectable
class AchievementAmogusTrack10seconds extends AchievementAmogusTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 10, `TAS Bot Approved`);
	}
}

abstract class AchievementOvalTrack extends AchievementCheckpointsWithTimeout {
	constructor(
		player: Player,
		playModeController: PlayModeController,
		timeout_seconds: number,
		name: string,
		description = `Make a lap on the Oval race track in ${timeout_seconds} seconds or less. No shortcut.`,
	) {
		super(
			player,
			playModeController,
			{
				id: `RACE_TRACK_OVALS_TARGET_${timeout_seconds}`,
				name,
				description,
			},
			timeout_seconds,
			"AmogusTrack",
		);
	}
}

@injectable
class AchievementOvalTrack20seconds extends AchievementOvalTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 20, `First Lap`);
	}
}

@injectable
class AchievementOvalTrack15seconds extends AchievementOvalTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 15, `Qualifying Lap`);
	}
}

@injectable
class AchievementOvalTrack10seconds extends AchievementOvalTrack {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(player, playModeController, 10, `Grind Prix`);
	}
}

@injectable
class AchievementAirRingsEasy extends AchievementCheckpoints {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(
			player,
			playModeController,
			{
				id: `AIR_COURSE_EASY`,
				name: "Flight School Graduate",
				description: `Finish easy difficulty air course`,
			},
			"AirRingsEasy",
		);
	}
}

@injectable
class AchievementAirRingsMedium extends AchievementCheckpointsWithTimeout {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(
			player,
			playModeController,
			{
				id: `AIR_COURSE_MEDIUM`,
				name: "Through John's Heart",
				description: `Finish medium difficulty air course in 25 seconds or less`,
			},
			25,
			"AirRingsMedium",
		);
	}
}

@injectable
class AchievementAirRingsHard extends AchievementCheckpointsWithTimeout {
	constructor(@inject player: Player, @inject playModeController: PlayModeController) {
		super(
			player,
			playModeController,
			{
				id: `AIR_COURSE_HARD`,
				name: "No Room for Error",
				description: `Finish intentionally hard air course in 60 seconds or less.. Designed to test player's skills in engineering and piloting.`,
			},
			60,
			"AirRingsHard",
		);
	}
}

abstract class AchievementFindGetNearObject extends Achievement {
	constructor(
		player: Player,
		data: baseAchievementStats,
		targetObject: BasePart | UnionOperation | undefined,
		activationDistance: number,
		waitTarget: number,
	) {
		super(player, data);

		let counter = 0;
		this.event.subscribe(RunService.Heartbeat, (delta) => {
			const character = player.Character?.PrimaryPart;

			if (!character || !targetObject) {
				counter = 0;
				return;
			}

			// same result, purposefully separated conditions
			if (character.Position.sub(targetObject.Position).Magnitude < activationDistance) {
				counter = 0;
				return;
			}

			counter += delta;

			this.set({ completed: counter >= waitTarget });
		});
	}
}

@injectable
class AchievementFindBanana extends AchievementFindGetNearObject {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "FIND_BANANA",
				name: "Completely bananas!",
				description: "Find the banana!",
				hidden: true,
			},
			ws.Map.Banana.PrimaryPart,
			10,
			8,
		);
	}
}

@injectable
class AchievementFindUFO extends AchievementFindGetNearObject {
	constructor(@inject player: Player) {
		super(
			player,
			{
				id: "FIND_UFO",
				name: "I Want to Believe!",
				description: "Find the UFO!",
				hidden: true,
			},
			ws.Map.UFO.PrimaryPart,
			15,
			8,
		);
	}
}

@injectable
class AchievementBreakSomething extends Achievement {
	constructor(@inject player: Player) {
		super(player, {
			id: "BREAK_MAP_DESTRUCTABLE",
			name: "Breaking Change",
			description: "Break a hydrant or something, or be near when it happens",
		});

		const activationDistance = 15;
		for (const o of ws.Map["Main Island"].Fun.Destructibles.GetChildren()) {
			if (o.Name !== "Fire Hydrant") continue;
			const obj = o as Model & {
				Main: BasePart & {
					TriggeredSound: Sound;
				};
			};

			this.event.subscribe(obj.Main.TriggeredSound.Played, () => {
				const character = player.Character?.PrimaryPart;
				if (!character) return;
				this.set({ completed: character.Position.sub(obj.Main.Position).Magnitude < activationDistance });
			});
		}
	}
}

@injectable
class AchievementFOVMax extends Achievement {
	constructor(@inject player: Player, @inject serverPlayerController: ServerPlayerController) {
		super(player, {
			id: "FOV_MAX",
			name: "Quake",
			description: "Set your FOV to the maximum value",
			hidden: true,
		});

		this.event.subscribe(serverPlayerController.remotes.player.updateSettings.invoked, (p, s) => {
			if (p !== player) return;
			if (!s.betterCamera?.fov) return;
			this.set({ completed: s.betterCamera.fov >= 200 });
		});
	}
}
