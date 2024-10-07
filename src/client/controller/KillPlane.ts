import { LocalPlayer } from "engine/client/LocalPlayer";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomDebrisService } from "shared/service/CustomDebrisService";

export const initKillPlane = (instance: BasePart, onTouch?: (part: BasePart) => void): SignalConnection => {
	return instance.Touched.Connect((part) => {
		if (part.HasTag("OBSTACLEPROOF")) return;

		let parent: Instance = part;
		while (true as boolean) {
			if (parent.FindFirstChild("Humanoid")) {
				const human = parent.WaitForChild("Humanoid") as Humanoid | undefined;
				if (human && human === LocalPlayer.humanoid.get()) {
					human.Health -= human.MaxHealth * 0.1;
				}

				return;
			}

			const nextparent = parent.Parent;
			if (!nextparent) break;

			parent = nextparent;
		}

		part.BreakJoints();
		CustomDebrisService.set(part, math.random(20, 60));

		onTouch?.(part);
	});
};
export const initLavaKillPlane = (instance: BasePart, onTouch?: (part: BasePart) => void): SignalConnection => {
	return initKillPlane(instance, (part) => {
		if (part.HasTag("LAVAPROOF")) return;

		RemoteEvents.Burn.send([part]);
		part.AssemblyLinearVelocity = part.AssemblyLinearVelocity.add(
			new Vector3(math.random() * 18 - 6, 25, math.random() * 18 - 6),
		);

		onTouch?.(part);
	});
};
