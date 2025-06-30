import { LogService } from "@rbxts/services";
import { ProtectedClass } from "client/integrity/ProtectedClass";
import type { IntegrityChecker } from "client/integrity/IntegrityChecker";

const forbiddenPrefixes = [
	"Script Raptor.Thread",
	"Script 'Script Raptor.Thread'",
	"RobloxReplicatedStorage.Xeno",
	"Script 'RobloxReplicatedStorage.Xeno",
	"Script 'ThirdPartyUserService",
	"Xeno",
	"[string",
	"Script '[string",
	"[JJSploit]",
	"[ Salad ]",
	"[Zorara]",
	"[XENO]",
	"=======",
	"Library Version:",
	"Executor :",
	"Welcome to",
	"Status :",
	"Jnvalid",
	"QueueOnTeleport",
	"AutoExecute",
	"fxception",
];

export class LoggingIntegrityChecker extends ProtectedClass {
	constructor(private readonly integrityChecker: IntegrityChecker) {
		super(script, (info) => this.integrityChecker.handle(info));

		this.initialize();
	}

	initialize() {
		LogService.MessageOut.Connect((message, _) => {
			for (const prefix of forbiddenPrefixes) {
				if (message.startsWith(prefix)) {
					this.integrityChecker.handle(`suspicious logging prefix: ${message}`);
				}
			}
		});
	}
}
