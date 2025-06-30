import { ProtectedClass } from "client/integrity/ProtectedClass";
import type { IntegrityChecker } from "client/integrity/IntegrityChecker";

const forbiddenServices = ["MessagingService", "AnimationFromVideoCreatorService", "VirtualInputManager"];

export class ForbiddenServicesIntegrityChecker extends ProtectedClass {
	findService(serviceName: string) {
		let success1: boolean | undefined;
		let success2: boolean | undefined;
		let success3: boolean | undefined;
		let success4: boolean | undefined;
		let result1: unknown;
		let result2: unknown;
		let result3: unknown;
		let result4: unknown;
		let result5: unknown;
		let returned: boolean | undefined;
		let _: unknown;

		task.spawn(() => {
			[success1, result1] = pcall(() => game.FindService(serviceName));
			[success2, result2] = pcall(() => game.FindFirstChild(serviceName));
			[success3, result3] = pcall(() => game.FindFirstChildOfClass(serviceName as never));
			[success4, result4] = pcall(() => game.FindFirstChildWhichIsA(serviceName as never));
			[_, result5] = pcall(() => game[serviceName as never] as unknown);
			result5 = type(result5) === "string" ? undefined : result5;
			returned = true;
		});

		if (
			(result1 && !typeIs(result1, "Instance")) ||
			!returned ||
			!success1 ||
			!success2 ||
			!success3 ||
			!success4 ||
			result1 !== result2 ||
			result2 !== result3 ||
			result3 !== result4 ||
			result4 !== result5
		) {
			return false;
		}

		return result1;
	}

	constructor(private readonly integrityChecker: IntegrityChecker) {
		super(script, (info) => this.integrityChecker.handle(info));

		task.spawn(() => {
			while (wait(1)[0]) {
				for (const serviceName of forbiddenServices) {
					if (this.findService(serviceName)) {
						this.integrityChecker.handle(`forbidden service found: ${serviceName}`);
					}
				}
			}
		});
	}
}
