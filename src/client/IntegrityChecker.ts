import {
	HttpService,
	Players,
	ReplicatedFirst,
	ReplicatedStorage,
	RunService,
	StarterGui,
	StarterPack,
	StarterPlayer,
	Workspace,
} from "@rbxts/services";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { HostedService } from "engine/shared/di/HostedService";
import { PlayerRank } from "engine/shared/PlayerRank";
import { CustomRemotes } from "shared/Remotes";

// Random
const scriptInstances: string[] = ["LocalScript", "Script", "ModuleScript"];

// Services
const protectedServices = [StarterPlayer, StarterPack, ReplicatedStorage];
const protectedServicesTypes: string[] = [
	"Folder",
	"RemoteEvent",
	"BindableEvent",
	"UnreliableRemoteEvent",

	"BindableFunction",
	"RemoteFunction",

	...scriptInstances,
];

// Player
const protectedCharacterTypes: string[] = [
	"VectorForce",
	"BodyVelocity",
	"BodyGyro",
	"BodyPosition",
	"BodyAngularVelocity",
	"BodyThrust",
];

/** Anti-exploit system */
export default class IntegrityChecker extends HostedService {
	detect(violation: string) {
		if (PlayerRank.isAdmin(LocalPlayer.player)) {
			$err(`Integrity violation detected: ${violation}`);
			return;
		}

		CustomRemotes.integrityViolation.send(violation);
	}

	constructor() {
		super();

		// Hide services names (protection against some exploits)
		if (!RunService.IsStudio()) {
			Players.Name = HttpService.GenerateGUID(false);
			ReplicatedFirst.Name = HttpService.GenerateGUID(false);
			ReplicatedStorage.Name = HttpService.GenerateGUID(false);
			StarterGui.Name = HttpService.GenerateGUID(false);
			Workspace.Name = HttpService.GenerateGUID(false);
			StarterPlayer.Name = HttpService.GenerateGUID(false);
		}

		this.initializeServicesProtection();
		this.initializeCharacterProtection();

		// Protect service itself
		script.Destroying.Connect(() => {
			this.detect("service destroyed");
		});
	}

	initializeCharacterProtection() {
		// Protection against character modification (e.g. adding BodyMovers for flying)
		this.event.subscribeObservable(
			LocalPlayer.character,
			(character) => {
				if (!character) return;

				character.DescendantAdded.Connect((desc) => {
					if (protectedCharacterTypes.includes(desc.ClassName)) {
						this.detect(`${desc.ClassName} added to character`);
					}

					if (scriptInstances.includes(desc.ClassName)) {
						if (desc.Name === "Animate" || desc.Name === "Health") {
							return;
						}

						this.detect(`${desc.ClassName} added to character: ${desc.GetFullName()}`);
					}
				});
			},
			true,
		);
	}

	initializeServicesProtection() {
		for (const service of protectedServices) {
			// Service name changed
			service.GetPropertyChangedSignal("Name").Connect(() => {
				if (protectedServicesTypes.includes(service.ClassName)) {
					this.detect(`${service.ClassName} renamed: ${service.Name}`);
				}
			});

			// Descendants added and removed
			service.DescendantAdded.Connect((desc) => {
				if (scriptInstances.includes(desc.ClassName)) {
					this.detect(`${desc.ClassName} added to ${service.Name}: ${desc.GetFullName()}`);
				}
			});

			const instances = service.GetDescendants();

			// Protect instance property changes
			for (const instance of instances) {
				if (!protectedServicesTypes.includes(instance.ClassName)) continue;

				instance.GetPropertyChangedSignal("Name").Connect(() => {
					if (protectedServicesTypes.includes(instance.ClassName)) {
						this.detect(`${instance.ClassName} renamed in ${service.Name}: ${instance.Name}`);
					}
				});

				instance.GetPropertyChangedSignal("Parent").Connect(() => {
					if (protectedServicesTypes.includes(instance.ClassName)) {
						this.detect(
							`${instance.ClassName} moved or deleted in ${service.Name}: ${instance.GetFullName()}`,
						);
					}
				});
			}
		}
	}
}
