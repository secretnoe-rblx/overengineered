import { ProtectedClass } from "client/integrity/ProtectedClass";
import { Objects } from "engine/shared/fixes/Objects";
import type { IntegrityChecker } from "client/integrity/IntegrityChecker";

export class GlobalsIntegrityChecker extends ProtectedClass {
	private readonly globalsAllowedKeys: string[] = [];

	scanGlobals() {
		const globals = Objects.keys(_G);
		for (const key of globals) {
			if (this.globalsAllowedKeys.includes(key)) {
				continue;
			}

			const data = _G[key as never] as { [key: string]: unknown };

			// Basically a check for Promise and import, which are used by the engine and should not be considered as a violation
			if (type(data) === "table" && data.Promise !== undefined && data.import !== undefined) {
				this.globalsAllowedKeys.push(key);
				continue;
			}

			this.integrityChecker.handle(`third party global variable found: ${key}`);
			this.globalsAllowedKeys.push(key);
		}
	}

	constructor(private readonly integrityChecker: IntegrityChecker) {
		super(script, (info) => this.integrityChecker.handle(info));

		task.spawn(() => {
			while (wait(1)[0]) {
				this.scanGlobals();
			}
		});
	}
}
