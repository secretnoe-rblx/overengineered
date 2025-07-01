import {
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
import { ServiceIntegrityChecker } from "client/integrity/ServiceIntegrityChecker";
import { Interface } from "engine/client/gui/Interface";
import { PlayerRank } from "engine/shared/PlayerRank";
import { CustomRemotes } from "shared/Remotes";

export class IntegrityChecker extends ProtectedClass {
	scriptInstances: (keyof Instances)[] = ["LocalScript", "ModuleScript", "Script"];
	remoteInstances: (keyof Instances)[] = [
		"RemoteEvent",
		"BindableEvent",
		"UnreliableRemoteEvent",
		"BindableFunction",
		"RemoteFunction",
	];

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

		new ServiceIntegrityChecker(this, ReplicatedStorage, {
			protectedClasses: {
				mode: "whitelist",
				instances: ["Folder", ...this.remoteInstances, ...this.scriptInstances],
			},
		});

		new ServiceIntegrityChecker(this, ReplicatedFirst, {
			protectedClasses: {
				mode: "whitelist",
				instances: [...this.remoteInstances, ...this.scriptInstances],
			},
		});

		new ServiceIntegrityChecker(this, StarterGui, {
			protectedClasses: {
				mode: "whitelist",
				instances: ["ScreenGui", ...this.scriptInstances],
			},
			protectedNames: { mode: "whitelist", names: StarterGui.GetChildren().map((child) => child.Name) },
		});

		new ServiceIntegrityChecker(this, Interface.getPlayerGui(), {
			protectedClasses: {
				mode: "whitelist",
				instances: ["ScreenGui", ...this.scriptInstances],
			},
			protectedNames: {
				mode: "whitelist",
				names: [
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
			},
		});

		new ServiceIntegrityChecker(this, Lighting, {
			protectedClasses: {
				mode: "whitelist",
				instances: [],
			},
		});

		new ServiceIntegrityChecker(this, Players, {
			protectedClasses: {
				mode: "whitelist",
				instances: [],
			},
		});

		new ServiceIntegrityChecker(this, Players.LocalPlayer.FindFirstChildOfClass("Backpack")!);
		new ServiceIntegrityChecker(this, Players.LocalPlayer.FindFirstChildOfClass("StarterGear")!);
		new ServiceIntegrityChecker(this, Players.LocalPlayer.FindFirstChildOfClass("PlayerScripts")!, {
			protectedNames: { mode: "whitelist", names: ["PlayerModule"] },
		});
		new ServiceIntegrityChecker(this, StarterPack);
		new ServiceIntegrityChecker(this, StarterPlayer, {
			protectedNames: { mode: "whitelist", names: ["PlayerModule"] },
		});

		// Other protections
		new GlobalsIntegrityChecker(this);
		new ForbiddenServicesIntegrityChecker(this);
		new CharacterIntegrityChecker(this);
		new LoggingIntegrityChecker(this);
		new AssetsIntegrityChecker(this);
	}
}
