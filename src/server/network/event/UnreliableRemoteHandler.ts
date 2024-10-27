import { Players, RunService, Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { ServerPartUtils } from "server/plots/ServerPartUtils";
import { ServerPlayers } from "server/ServerPlayers";
import { BlockManager } from "shared/building/BlockManager";
import { RemoteEvents } from "shared/RemoteEvents";
import { CustomRemotes } from "shared/Remotes";
import type { SpreadingFireController } from "server/SpreadingFireController";
import type { ExplosionEffect } from "shared/effects/ExplosionEffect";
import type { ImpactSoundEffect } from "shared/effects/ImpactSoundEffect";
import type { ClientExplodeArgs } from "shared/RemoteEvents";

@injectable
export class UnreliableRemoteController extends HostedService {
	constructor(
		@inject impactSoundEffect: ImpactSoundEffect,
		@inject spreadingFire: SpreadingFireController,
		@inject explosionEffect: ExplosionEffect,
	) {
		super();

		const breakQueue: Map<Player, BasePart[]> = new Map();
		const serverBreakQueue: Set<BasePart> = new Set();

		const impactBreakEvent = (player: Player | undefined, parts: BasePart[]) => {
			if (!player) {
				for (const part of parts) {
					serverBreakQueue.add(part);
				}
				return;
			}

			const newData = breakQueue.get(player) ?? [];
			breakQueue.set(player, newData);

			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				newData.push(part);
			});
		};

		this.event.subscribe(RunService.Heartbeat, (dT) => {
			if (breakQueue.size() > 0) {
				const copy = [...breakQueue];
				breakQueue.clear();

				task.spawn(() => {
					for (const [player, blocks] of copy) {
						const players = ServerPlayers.GetLoadedPlayers().filter((p) => p !== player);
						CustomRemotes.physics.normalizeRootparts.send(players, { parts: blocks });
						impactSoundEffect.send(blocks[0], { blocks, index: undefined });

						for (const part of blocks) {
							ServerPartUtils.BreakJoints(part);
							// part.CollisionGroup = "Wreckage";
						}
					}
				});
			}

			if (serverBreakQueue.size() > 0) {
				const copy = [...serverBreakQueue];
				serverBreakQueue.clear();

				task.spawn(() => {
					for (const block of copy) {
						impactSoundEffect.send(block, { blocks: [block], index: undefined });
						ServerPartUtils.BreakJoints(block);
					}
					const players = ServerPlayers.GetLoadedPlayers();
					CustomRemotes.physics.normalizeRootparts.send(players, { parts: copy });
				});
			}
		});

		const burnEvent = (parts: BasePart[]) => {
			parts.forEach((part) => {
				if (!BlockManager.isActiveBlockPart(part)) return;

				spreadingFire.burn(part);
			});
		};

		// TODO: Change this for some offensive update
		const explode = (
			player: Player | undefined,
			{ origin, localParts, isFlammable, pressure, radius, soundIndex }: ClientExplodeArgs,
		) => {
			const parts = localParts.filter((value) => BlockManager.isActiveBlockPart(value));

			if (isFlammable) {
				const flameHitParts = Workspace.GetPartBoundsInRadius(origin.Position, radius * 1.5);

				flameHitParts.forEach((part) => {
					if (math.random(1, 8) === 1) {
						spreadingFire.burn(part);
					}
				});
			}

			const players = Players.GetPlayers().filter((p) => p !== player);
			CustomRemotes.physics.normalizeRootparts.send(players, { parts: parts });
			for (const localPart of parts) {
				ServerPartUtils.BreakJoints(localPart);
			}

			// Explosion sound
			RemoteEvents.ServerExplode.send(players, {
				origin: origin,
				radius: radius,
				pressure: pressure,
				isFlammable: isFlammable,
				soundIndex: soundIndex,
			});
		};

		this.event.subscribe(RemoteEvents.ImpactBreak.invoked, impactBreakEvent);
		this.event.subscribe(RemoteEvents.Burn.invoked, (_, parts) => burnEvent(parts));
		this.event.subscribe(RemoteEvents.ClientExplode.invoked, explode);
	}
}
