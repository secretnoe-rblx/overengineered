import { HttpService, RunService } from "@rbxts/services";
import { ProtectedClass } from "client/integrity/ProtectedClass";
import type { IntegrityChecker } from "client/integrity/IntegrityChecker";

type Properties = {
	encryptName?: boolean;
	protectedClasses?: { mode: "all" } | { mode: "whitelist" | "blacklist"; instances: (keyof Instances)[] };
	protectedNames?: { mode: "whitelist" | "blacklist"; names: string[] };
};

export class ServiceIntegrityChecker extends ProtectedClass {
	private static readonly whitelist = new Set<Instance>();

	static whitelistInstance(instance: Instance) {
		this.whitelist.add(instance);
		$debug(`Added ${instance.GetFullName()} to integrity whitelist`);

		instance.Destroying.Connect(() => {
			task.wait(1);
			this.whitelist.delete(instance);
			$debug(`Removed ${instance.GetFullName()} from integrity whitelist (destroyed)`);
		});
	}

	constructor(
		private readonly integrityChecker: IntegrityChecker,
		private readonly service: Instance,
		private readonly properties: Properties = {},
	) {
		super(script, (info) => this.integrityChecker.handle(info));

		// Defaults
		this.properties.encryptName ??= true;
		this.properties.protectedClasses ??= { mode: "all" };
		this.properties.protectedNames ??= { mode: "whitelist", names: [] };

		// Functionality
		if (this.properties.encryptName) this.encryptName(service);

		service.DescendantAdded.Connect((instance) => {
			if (this.hasPermissions(instance)) {
				this.watchInstance(instance);
			} else {
				this.integrityChecker.handle(
					`${instance.ClassName} added to ${this.service.ClassName}: ${this.prettyPath(instance)}`,
				);
			}
		});

		service.DescendantRemoving.Connect((instance) => {
			if (!this.hasPermissions(instance)) {
				this.integrityChecker.handle(
					`${instance.ClassName} removed from ${this.service.ClassName}: ${this.prettyPath(instance)}`,
				);
			}
		});

		// Existing descendants init
		for (const instance of service.GetDescendants()) {
			this.watchInstance(instance);
		}

		// Watch the service itself
		this.watchInstance(service);
	}

	private hasPermissions(instance: Instance) {
		if (!this.isClassProtected(instance)) return true;

		// Deep-check for whitelisted instances
		for (const whitelistedInstance of ServiceIntegrityChecker.whitelist) {
			if (whitelistedInstance.IsAncestorOf(instance)) {
				return true;
			}
		}

		// Requires 1 tick (last attempt)
		if (this.isInstancePathWhitelisted(instance)) return true;

		// Required to be running after 1 tick to ensure the instance is fully initialized
		if (ServiceIntegrityChecker.whitelist.has(instance)) return true;

		return false;
	}

	private prettyPath(path: Instance): string {
		return path
			.GetFullName()
			.gsub(
				"%x%x%x%x%x%x%x%x%-%x%x%x%x%-%x%x%x%x%-%x%x%x%x%-%x%x%x%x%x%x%x%x%x%x%x%x",
				this.service.ClassName,
				1,
			)[0];
	}

	private isClassProtected(instance: Instance) {
		if (this.properties.protectedClasses) {
			if (this.properties.protectedClasses.mode === "all") {
				return true;
			} else if (this.properties.protectedClasses.mode === "whitelist") {
				return this.properties.protectedClasses.instances.includes(instance.ClassName as keyof Instances);
			} else if (this.properties.protectedClasses.mode === "blacklist") {
				return !this.properties.protectedClasses.instances.includes(instance.ClassName as keyof Instances);
			}
		}
		return false;
	}

	private isInstancePathWhitelisted(instance: Instance) {
		if (!this.properties.protectedNames) return false;

		task.wait(); // Wait for the instance to be fully initialized

		const path = instance.GetFullName();

		for (const name of this.properties.protectedNames.names) {
			if (this.properties.protectedNames.mode === "whitelist") {
				if (path.contains(name)) {
					return true;
				}
			} else if (this.properties.protectedNames.mode === "blacklist") {
				if (!path.contains(name)) {
					return true;
				}
			}
		}

		return false;
	}

	private watchInstance(instance: Instance) {
		instance.GetPropertyChangedSignal("Name").Connect(() => {
			if (!this.hasPermissions(instance)) {
				this.integrityChecker.handle(
					`${instance.ClassName} renamed in ${this.service.ClassName}: ${this.prettyPath(instance)}`,
				);
			}
		});
	}

	private encryptName(path: Instance) {
		if (RunService.IsStudio()) {
			path.Name = `Protected${path.Name}`;
		} else {
			path.Name = HttpService.GenerateGUID(false);
		}
	}
}
