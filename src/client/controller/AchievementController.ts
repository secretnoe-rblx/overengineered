import { HostedService } from "engine/shared/di/HostedService";
import { CustomRemotes } from "shared/Remotes";

export class AchievementController extends HostedService {
	constructor() {
		super();

		this.event.subscribe(CustomRemotes.achievements.loaded.invoked, (data) => print("AMONGUS LOADED", data));
		this.event.subscribe(CustomRemotes.achievements.update.invoked, (data) => print("AMONGUS UPDATE ", data));
	}
}
