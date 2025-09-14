import { HostedService } from "engine/shared/di/HostedService";
import { Achievement } from "server/Achievement";
import { CustomRemotes } from "shared/Remotes";
import type { ServerPlayersController } from "server/ServerPlayersController";

const init = (list: AchievementList, player: Player) => {
	const achievements: readonly ConstructorOf<Achievement>[] = [
		//
		AchievementWelcome,
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
