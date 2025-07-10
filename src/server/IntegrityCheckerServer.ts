import { HostedService } from "engine/shared/di/HostedService";
import { ExternalDatabaseBans } from "server/database/ExternalDatabaseBans";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerDatabase } from "server/database/PlayerDatabase";
import type { NetworkLogging } from "server/network/NetworkLogging";

@injectable
export class IntegrityCheckerServer extends HostedService {
	private detectedPlayers: Set<Player> = new Set();

	constructor(@inject networkLogging: NetworkLogging, @inject players: PlayerDatabase) {
		super();

		// FIXME: test enough and then add bans
		CustomRemotes.integrityViolation.invoked.Connect((player, violation) => {
			$err(`Integrity violation detected: ${violation} from player ${player.Name}`);

			if (this.detectedPlayers.has(player)) {
				// Player already detected, ignore further violations
				return;
			}

			this.detectedPlayers.add(player);

			networkLogging.log({
				source: networkLogging.getSourceFromPlayer(player),
				action: "integrity",
				data: violation,
			});

			// Add warning to the player
			const warnings = players.get(player.UserId)?.data?.warnings ?? 0;
			players.set(player.UserId, {
				...players.get(player.UserId),
				data: {
					...(players.get(player.UserId)?.data ?? {}),
					warnings: warnings + 1,
				},
			});

			const data = this.calculateBanDuration(warnings) ?? [undefined, "Exploiting"];
			ExternalDatabaseBans.Ban(player, data[1], data[0]);
		});
	}

	private calculateBanDuration(violationCount: number): [number, string] | undefined {
		const banMessages: [number, string][] = [
			[2_592_000, "Exploiting detected. Enjoy your vacation — it's a long one."],
			[
				15_552_000,
				"It seems the previous ban didn't teach you anything. Well, never mind, maybe you'll grow up.",
			],
			[31_536_000, "At this point, you're less of a player and more of a recurring issue. Take a year off."],
			[63_072_000, "Two years. That's how long it takes to get a master's degree in not cheating."],
			[94_608_000, "Three years. You could’ve learned a new language, but you chose to glitch walls instead."],
		];

		return banMessages[violationCount - 1];
	}
}
