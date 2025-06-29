import { HostedService } from "engine/shared/di/HostedService";
import { CustomRemotes } from "shared/Remotes";
import type { NetworkLogging } from "engine/server/network/NetworkLogging";

@injectable
export class IntegrityCheckerServer extends HostedService {
	constructor(@inject networkLogging: NetworkLogging) {
		super();

		// FIXME: test enough and then add bans
		CustomRemotes.integrityViolation.invoked.Connect((player, violation) => {
			// player.Kick();

			networkLogging.log({
				source: networkLogging.getSourceFromPlayer(player),
				action: "leave",
				data: `Integrity violation detected: ${violation} from player ${player.Name}`,
			});

			$err(`Integrity violation detected: ${violation} from player ${player.Name}`);
		});
	}
}
