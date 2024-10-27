import { Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { RemoteEvents } from "shared/RemoteEvents";
import { PartUtils } from "shared/utils/PartUtils";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { ExplosionEffect } from "shared/effects/ExplosionEffect";

@injectable
export class ExplosionManager extends HostedService {
	constructor(
		@inject private readonly plot: SharedPlot,
		@inject private readonly effect: ExplosionEffect,
	) {
		super();

		RemoteEvents.ServerExplode.invoked.Connect(({ origin, radius, pressure, isFlammable, soundIndex }) => {
			this.explode(origin, radius, pressure, isFlammable, soundIndex);
		});
	}

	/** Local explosion, affects only localplayer's blocks */
	explode(origin: BasePart, radius: number, pressure: number, flammable: boolean, soundIndex?: number) {
		const affectedParts = Workspace.GetPartBoundsInRadius(origin.Position, radius).filter((value) =>
			value.IsDescendantOf(this.plot.instance),
		);

		for (const affectedPart of affectedParts) {
			PartUtils.BreakJoints(affectedPart);
		}

		for (const affectedPart of affectedParts) {
			// Roblox native behavior
			const predictedVelocity = affectedPart.Position.sub(origin.Position)
				.Unit.mul(pressure)
				.div(affectedPart.Mass)
				.div(6080);

			affectedPart.ApplyImpulse(predictedVelocity);
		}

		// No sound index - local run then
		const randomSoundIndex = this.effect.justRun({ part: origin, index: soundIndex });
		if (!soundIndex) {
			RemoteEvents.ClientExplode.send({
				isFlammable: flammable,
				localParts: affectedParts,
				origin: origin,
				pressure: pressure,
				radius: radius,
				soundIndex: randomSoundIndex,
			});
		}

		origin.Destroy();
	}
}
