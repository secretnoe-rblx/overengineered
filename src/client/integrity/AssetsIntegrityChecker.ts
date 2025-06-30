import { ContentProvider } from "@rbxts/services";
import { ProtectedClass } from "client/integrity/ProtectedClass";
import type { IntegrityChecker } from "client/integrity/IntegrityChecker";

let DeltaIcon = "rbxasset://custom_gloop/new_logo.png";

/**
 * @deprecated I don't know if this works anymore, but it was used to detect Delta exploit
 */
export class AssetsIntegrityChecker extends ProtectedClass {
	constructor(private readonly integrityChecker: IntegrityChecker) {
		super(script, (info) => this.integrityChecker.handle(info));

		this.initialize();
	}

	initialize() {
		let secondsElapsed = 0;

		task.spawn(() => {
			while (wait(1)[0]) {
				ContentProvider.PreloadAsync([DeltaIcon], (ID, Status) => {
					if (Status === Enum.AssetFetchStatus.Success) {
						this.integrityChecker.handle(`Delta exploit detected: ${ID}`);
					}
				});

				// adding null terminators every iteration because roblox caches the result
				DeltaIcon += "\0";

				secondsElapsed += 1;
				if (secondsElapsed > 30) {
					break;
				}
			}
		});
	}
}
