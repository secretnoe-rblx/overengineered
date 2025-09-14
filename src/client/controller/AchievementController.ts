import { HostedService } from "engine/shared/di/HostedService";
import { CustomRemotes } from "shared/Remotes";

export class AchievementController extends HostedService {
	constructor() {
		super();

		this.event.subscribe(CustomRemotes.achievementUpdated.invoked, ({ id, data }) =>
			print("AMONGUS UPDATE ", id, data),
		);
		this.event.subscribe(CustomRemotes.achievementsLoaded.invoked, (data) => print("AMONGUS LOADED", data));
	}
}
