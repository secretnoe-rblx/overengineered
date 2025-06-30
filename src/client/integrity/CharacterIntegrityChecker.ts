import { ProtectedClass } from "client/integrity/ProtectedClass";
import { LocalPlayer } from "engine/client/LocalPlayer";
import type { IntegrityChecker } from "client/integrity/IntegrityChecker";
import type { Instances } from "engine/shared/fixes/Instances";

const forbiddenInstances: (keyof Instances)[] = [
	// Modern movement instances
	"VectorForce",
	"AngularVelocity",
	"LinearVelocity",

	// Legacy movement instances
	"BodyVelocity",
	"BodyGyro",
	"BodyPosition",
	"BodyAngularVelocity",
	"BodyThrust",

	// Anti-ESP's
	"Highlight",
];

export class CharacterIntegrityChecker extends ProtectedClass {
	constructor(private readonly integrityChecker: IntegrityChecker) {
		super(script, (info) => this.integrityChecker.handle(info));

		this.initialize();
	}

	initialize() {
		LocalPlayer.character.subscribe((character) => {
			if (!character) return;

			character.DescendantAdded.Connect((desc) => {
				task.wait();

				if (this.integrityChecker.isWhitelisted(desc)) {
					return;
				}

				if (forbiddenInstances.includes(desc.ClassName as keyof Instances)) {
					this.integrityChecker.handle(`${desc.ClassName} added to character`);
					return;
				}

				if (this.integrityChecker.scriptInstances.includes(desc.ClassName as keyof Instances)) {
					if (desc.Name === "Animate" || desc.Name === "Health") {
						return;
					}

					this.integrityChecker.handle(`${desc.ClassName} added to character`);
				}
			});
		}, true);
	}
}
