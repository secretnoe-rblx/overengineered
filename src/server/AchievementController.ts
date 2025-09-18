import { RunService, TextChatService, UserInputService } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { Achievement } from "server/Achievement";
import { CustomRemotes } from "shared/Remotes";
import type { ServerPlayersController } from "server/ServerPlayersController";
import type { FireEffect } from "shared/effects/FireEffect";

const init = (list: AchievementList, player: Player) => {
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
	];

	const instanced = achievements.map((ach) => list.add(ach));
	CustomRemotes.achievementsLoaded.send(player, asObject(list.list.mapToMap((k, v) => $tuple(k, v.info))));
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
			task.defer(() => init(list, controller.player));
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
	constructor(@injectable player: Player) {
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

class AchievementHeightRecord extends Achievement<{ height_record: number }> {
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
	constructor(@injectable player: Player) {
		super(player, `Space tourism`, `Leave the atmosphere`, 25_000);
	}
}

@injectable
class AchievementHeightRecord75k extends AchievementHeightRecord {
	constructor(@injectable player: Player) {
		super(player, `SPAAAAACE`, `Deeper into the void!`, 75_000);
	}
}

@injectable
class AchievementHeightRecord150k extends AchievementHeightRecord {
	constructor(@injectable player: Player) {
		super(player, `Deepfried space`, `Things are wobbly over here`, 150_000);
	}
}

class AchievementSpeedRecord extends Achievement<{ time_record: number }> {
	constructor(player: Player, name: string, targetSpeed: number, hidden = false) {
		super(player, {
			id: `SPEED_TARGET_${targetSpeed}`,
			name: name,
			description: `Reach speed over ${targetSpeed} studs/second in horizontal axis for 3 seconds`,
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
	constructor(@injectable player: Player) {
		super(player, `A bit fast, eh?`, 1000);
	}
}

@injectable
class AchievementSpeedRecord5k extends AchievementSpeedRecord {
	constructor(@injectable player: Player) {
		super(player, `4.114 Machs doesn't sound like a lot`, 5000);
	}
}

@injectable
class AchievementSpeedRecord15k extends AchievementSpeedRecord {
	constructor(@injectable player: Player) {
		super(player, `BRO WHERE ARE WE GOING?!`, 15_000, true);
	}
}

@injectable
class AchievementSpeedRecord50k extends AchievementSpeedRecord {
	constructor(@injectable player: Player) {
		super(player, `Typical High Speed Fan`, 50_000, true);
	}
}

@injectable
class AchievementSpeedRecord100k extends AchievementSpeedRecord {
	constructor(@injectable player: Player) {
		super(player, `Lightspeed Enjoyer`, 150_000, true);
	}
}

@injectable
class AchievementCatchOnFire extends Achievement {
	constructor(@injectable player: Player, @inject fireffect: FireEffect) {
		super(player, {
			id: "CATCH_ON_FIRE",
			name: "OverCooked!",
			description: "Better call the fire department! (We don't have one.)",
		});

		this.event.subscribe(fireffect.event.c2s.invoked, (owner) => this.set({ completed: owner === player }));
	}
}
