import {
	HttpService,
	LogService,
	Players,
	ReplicatedFirst,
	ReplicatedStorage,
	RunService,
	StarterGui,
	StarterPack,
	StarterPlayer,
	Workspace,
} from "@rbxts/services";
import { Interface } from "engine/client/gui/Interface";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { HostedService } from "engine/shared/di/HostedService";
import { Objects } from "engine/shared/fixes/Objects";
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
const forbiddenServices = ["MessagingService", "AnimationFromVideoCreatorService", "VirtualInputManager"];

// Player
const forbiddenCharacterClassNames: string[] = [
	"VectorForce",
	"BodyVelocity",
	"BodyGyro",
	"BodyPosition",
	"BodyAngularVelocity",
	"BodyThrust",
];

// Prints
const forbiddenLogPrefixes = [
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

/** Anti-exploit system */
export default class IntegrityChecker extends HostedService {
	static readonly whitelist = new Set<Instance>();
	static readonly globalsAllowedKeys: string[] = [];

	constructor() {
		super();

		// Protect logging
		LogService.MessageOut.Connect((message, _) => {
			for (const prefix of forbiddenLogPrefixes) {
				if (message.startsWith(prefix)) {
					this.handle(`print with banned prefix: ${message}`);
				}
			}
		});

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
		this.initializeGUIProtection();

		this.event.loop(1, () => {
			// Forbidden services checking
			for (const serviceName of forbiddenServices) {
				if (this.findService(serviceName)) {
					this.handle(`forbidden service found: ${serviceName}`);
				}
			}

			// Globals checking
			this.scanGlobals();
		});

		// Protect service itself
		script.Destroying.Connect(() => {
			this.handle("service destroyed");
		});
	}

	scanGlobals() {
		const globals = Objects.keys(_G);
		for (const key of globals) {
			if (IntegrityChecker.globalsAllowedKeys.includes(key)) {
				continue;
			}

			const data = _G[key as never] as { [key: string]: unknown };

			// Basically a check for Promise and import, which are used by the engine and should not be considered as a violation
			if (type(data) === "table" && data.Promise !== undefined && data.import !== undefined) {
				IntegrityChecker.globalsAllowedKeys.push(key);
				continue;
			}

			this.handle(`global variable found: ${key}`);
			IntegrityChecker.globalsAllowedKeys.push(key);
		}
	}

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

	handle(violation: string) {
		if (PlayerRank.isAdmin(LocalPlayer.player)) {
			$err(`Integrity violation detected: ${violation}`);
			return;
		}

		CustomRemotes.integrityViolation.send(violation);
	}

	isWhitelisted(instance: Instance): boolean {
		if (IntegrityChecker.whitelist.has(instance)) {
			IntegrityChecker.whitelist.delete(instance);
			return true;
		}
		return false;
	}

	/** Protection against modification of player GUI */
	// TODO: implement protection against other modifications of PlayerGui
	initializeGUIProtection() {
		const starterGuiInstances = StarterGui.GetChildren().map((child) => child.Name);
		const guiNamesWhitelist = ["ContextActionGui", "Sun", "TouchGui", "RbxCameraUI"];

		Interface.getPlayerGui().ChildAdded.Connect((desc) => {
			task.wait();

			if (this.isWhitelisted(desc)) {
				return;
			}

			// Protection against scripts
			if (scriptInstances.includes(desc.ClassName)) {
				this.handle(`${desc.ClassName} added to PlayerGui: ${desc.GetFullName()}`);
			}

			// Protection against ScreenGuis
			if (
				desc.ClassName === "ScreenGui" &&
				!starterGuiInstances.includes(desc.Name) &&
				!guiNamesWhitelist.includes(desc.Name)
			) {
				this.handle(`ScreenGui added to StarterGui: ${desc.GetFullName()}`);
			}
		});
	}

	/** Protection against character modification (e.g. adding BodyMovers for flying) */
	initializeCharacterProtection() {
		this.event.subscribeObservable(
			LocalPlayer.character,
			(character) => {
				if (!character) return;

				character.DescendantAdded.Connect((desc) => {
					task.wait();

					if (this.isWhitelisted(desc)) {
						return;
					}

					if (forbiddenCharacterClassNames.includes(desc.ClassName)) {
						this.handle(`${desc.ClassName} added to character`);
					}

					if (scriptInstances.includes(desc.ClassName)) {
						if (desc.Name === "Animate" || desc.Name === "Health") {
							return;
						}

						this.handle(`${desc.ClassName} added to character: ${desc.GetFullName()}`);
					}
				});
			},
			true,
		);
	}

	/** Protection against modification of protected services */
	initializeServicesProtection() {
		for (const service of protectedServices) {
			// Service name changed
			service.GetPropertyChangedSignal("Name").Connect(() => {
				if (protectedServicesTypes.includes(service.ClassName)) {
					this.handle(`${service.ClassName} renamed: ${service.Name}`);
				}
			});

			// Descendants added and removed
			service.DescendantAdded.Connect((desc) => {
				task.wait();

				if (this.isWhitelisted(desc)) {
					return;
				}

				if (scriptInstances.includes(desc.ClassName)) {
					this.handle(`${desc.ClassName} added to ${service.Name}: ${desc.GetFullName()}`);
				}
			});

			const instances = service.GetDescendants();

			// Protect instance property changes
			for (const instance of instances) {
				if (!protectedServicesTypes.includes(instance.ClassName)) continue;

				instance.GetPropertyChangedSignal("Name").Connect(() => {
					if (protectedServicesTypes.includes(instance.ClassName)) {
						this.handle(`${instance.ClassName} renamed in ${service.Name}: ${instance.Name}`);
					}
				});

				instance.GetPropertyChangedSignal("Parent").Connect(() => {
					if (protectedServicesTypes.includes(instance.ClassName)) {
						this.handle(
							`${instance.ClassName} moved or deleted in ${service.Name}: ${instance.GetFullName()}`,
						);
					}
				});
			}
		}
	}
}
