// part of private anywaymachines service
export namespace ServiceIntegrityChecker {
	export const whitelist = new Set<Instance>();

	export function whitelistInstance(instance: Instance) {
		whitelist.add(instance);
		$debug(`Added ${instance.GetFullName()} to integrity whitelist`);

		instance.Destroying.Connect(() => {
			task.wait(1);
			whitelist.delete(instance);
			$debug(`Removed ${instance.GetFullName()} from integrity whitelist (destroyed)`);
		});
	}
}
