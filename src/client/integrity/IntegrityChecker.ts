import {
	HttpService,
	Lighting,
	Players,
	ReplicatedFirst,
	ReplicatedStorage,
	StarterGui,
	StarterPack,
	StarterPlayer,
} from "@rbxts/services";
import { AssetsIntegrityChecker } from "client/integrity/AssetsIntegrityChecker";
import { CharacterIntegrityChecker } from "client/integrity/CharacterIntegrityChecker";
import { ForbiddenServicesIntegrityChecker } from "client/integrity/ForbiddenServicesIntegrityChecker";
import { GlobalsIntegrityChecker } from "client/integrity/GlobalsIntegrityChecker";
import { LoggingIntegrityChecker } from "client/integrity/LoggingIntegrityChecker";
import { ProtectedClass } from "client/integrity/ProtectedClass";
import { Interface } from "engine/client/gui/Interface";
import { PlayerRank } from "engine/shared/PlayerRank";
import { CustomRemotes } from "shared/Remotes";

export class IntegrityChecker extends ProtectedClass {
	static readonly whitelist = new Set<Instance>();

	// Pre-made configurations
	scriptInstances: (keyof Instances)[] = ["LocalScript", "ModuleScript", "Script"];
	remoteInstances: (keyof Instances)[] = [
		"RemoteEvent",
		"BindableEvent",
		"UnreliableRemoteEvent",
		"BindableFunction",
		"RemoteFunction",
	];

	protectLocation(
		path: Instance,
		properties?: {
			protectedName?: boolean;
			protectChildrenInstead?: boolean;
			protectedInstances?: (keyof Instances)[] | "*";
			protectDestroying?: boolean;
			whitelistedNames?: string[];
		},
	) {
		properties ??= {};
		properties.protectedName ??= true;
		properties.protectChildrenInstead ??= false;
		properties.protectedInstances ??= "*";
		properties.protectDestroying ??= true;
		properties.whitelistedNames ??= [];

		if (properties.protectedName) {
			path.Name = HttpService.GenerateGUID(false);
		}

		if (
			type(properties.protectedInstances) === "table" &&
			(properties.protectedInstances as defined[]).size() === 0
		) {
			return;
		}

		const getReadableName = (str: string) => {
			return str.gsub(
				"%x%x%x%x%x%x%x%x%-%x%x%x%x%-%x%x%x%x%-%x%x%x%x%-%x%x%x%x%x%x%x%x%x%x%x%x",
				path.ClassName,
				1,
			)[0];
		};

		// Default checks
		path.GetPropertyChangedSignal("Name").Connect(() => {
			this.handle(`${path.ClassName} renamed: ${path.Name}`);
		});

		(properties.protectChildrenInstead ? path.ChildAdded : path.DescendantAdded).Connect((desc) => {
			task.wait();

			if (this.isWhitelisted(desc)) {
				protectInstance(desc);
				return;
			}

			if (properties.whitelistedNames?.includes(desc.Name)) {
				protectInstance(desc);
				return;
			}

			if (
				properties.protectedInstances === "*" ||
				properties.protectedInstances?.includes(desc.ClassName as keyof Instances)
			) {
				this.handle(`${desc.ClassName} added to ${path.ClassName}: ${getReadableName(desc.GetFullName())}`);
			}
		});

		if (properties.protectDestroying) {
			(properties.protectChildrenInstead ? path.ChildRemoved : path.DescendantRemoving).Connect((desc) => {
				task.wait();

				if (this.isWhitelisted(desc)) {
					return;
				}

				if (properties.whitelistedNames?.includes(desc.Name)) {
					return;
				}

				if (
					properties.protectedInstances === "*" ||
					properties.protectedInstances?.includes(desc.ClassName as keyof Instances)
				) {
					this.handle(
						`${desc.ClassName} removed from ${path.ClassName}: ${getReadableName(desc.GetFullName())}`,
					);
				}
			});
		}

		const protectInstance = (instance: Instance) => {
			if (
				properties.protectedInstances !== "*" &&
				!properties.protectedInstances?.includes(instance.ClassName as keyof Instances)
			)
				return;

			instance.GetPropertyChangedSignal("Name").Connect(() => {
				this.handle(
					`${instance.ClassName} renamed in ${path.ClassName}: ${getReadableName(instance.GetFullName())}`,
				);
			});
		};

		// Protect instance property changes
		for (const instance of path.GetDescendants()) {
			protectInstance(instance);
		}
	}

	isWhitelisted(instance: Instance): boolean {
		if (IntegrityChecker.whitelist.has(instance)) {
			IntegrityChecker.whitelist.delete(instance);
			return true;
		}
		return false;
	}

	handle(violation: string) {
		if (PlayerRank.isAdmin(Players.LocalPlayer)) {
			$err(`Integrity violation detected: ${violation}`);
			return;
		}

		// TODO: Restore this remote on destroy and notify the server
		try {
			CustomRemotes.integrityViolation.send(violation);
		} catch (error) {
			Players.LocalPlayer.Kick();
		}
	}

	constructor() {
		super(script, (info) => this.handle(info));

		this.protectLocation(ReplicatedStorage, {
			protectedInstances: ["Folder", ...this.remoteInstances, ...this.scriptInstances],
		});
		this.protectLocation(ReplicatedFirst, {
			protectedInstances: ["Folder", ...this.remoteInstances, ...this.scriptInstances],
		});
		this.protectLocation(StarterGui, {
			protectedInstances: ["ScreenGui", ...this.scriptInstances],
		});
		this.protectLocation(Interface.getPlayerGui(), {
			protectedInstances: ["ScreenGui", ...this.scriptInstances],
			protectChildrenInstead: true,
			protectDestroying: false,
			whitelistedNames: [
				...StarterGui.GetChildren().map((child) => child.Name),
				// Native
				"ContextActionGui",
				"TouchGui",
				"RbxCameraUI",
				"ProximityPrompts",

				// Atmosphere
				"Sun",

				// Our custom interfaces
				"Remotes",
			],
		});
		this.protectLocation(Lighting, {
			protectedInstances: [],
		});
		this.protectLocation(Players, {
			protectedInstances: [],
		});

		// Full isolation
		this.protectLocation(Players.LocalPlayer.FindFirstChildOfClass("Backpack")!);
		this.protectLocation(Players.LocalPlayer.FindFirstChildOfClass("StarterGear")!);
		this.protectLocation(Players.LocalPlayer.FindFirstChildOfClass("PlayerScripts")!, {
			whitelistedNames: [
				"PlayerModule",
				...StarterPlayer.FindFirstChildOfClass("StarterPlayerScripts")!
					.FindFirstChild("PlayerModule")!
					.GetDescendants()
					.map((child) => child.Name),
			],
			protectDestroying: false,
		});
		this.protectLocation(StarterPack);
		this.protectLocation(StarterPlayer, {
			whitelistedNames: [
				"PlayerModule",
				...StarterPlayer.FindFirstChildOfClass("StarterPlayerScripts")!
					.FindFirstChild("PlayerModule")!
					.GetDescendants()
					.map((child) => child.Name),
			],
		});

		// Other protections
		new GlobalsIntegrityChecker(this);
		new ForbiddenServicesIntegrityChecker(this);
		new CharacterIntegrityChecker(this);
		new LoggingIntegrityChecker(this);
		new AssetsIntegrityChecker(this);
	}
}
