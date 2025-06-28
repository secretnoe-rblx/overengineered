import { AES, Base64 } from "@rbxts/crypto";
import { CustomRemotes } from "shared/Remotes";

export namespace IntegrityCheckerServer {
	export function initialize() {
		// FIXME: test enough and then add bans
		CustomRemotes.integrityViolation.invoked.Connect((player, violation) => {
			player.Kick(`System error: "${Base64.Encode(AES.Encrypt(violation, "noexploits"))}"`);
			$err(`Integrity violation detected: ${violation} from player ${player.Name}`);
		});
	}
}
