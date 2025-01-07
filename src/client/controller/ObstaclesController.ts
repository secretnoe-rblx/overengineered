import { CollectionService } from "@rbxts/services";
import { initKillPlane, initLavaKillPlane } from "client/controller/KillPlane";
import { HostedService } from "engine/shared/di/HostedService";
import { Signal } from "engine/shared/event/Signal";

export class ObstaclesController extends HostedService {
	constructor() {
		super();

		this.event.subscribeRegistration(() => {
			const subs: SignalConnection[] = [];

			for (const lava of CollectionService.GetTagged("Lava")) {
				if (!lava.IsA("BasePart")) continue;
				subs.push(initLavaKillPlane(lava));
			}

			for (const destroyer of CollectionService.GetTagged("Destroyer")) {
				if (!destroyer.IsA("BasePart")) continue;
				subs.push(initKillPlane(destroyer));
			}

			return Signal.multiConnection(...subs);
		});
	}
}
