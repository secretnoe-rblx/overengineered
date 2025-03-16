import { CollectionService } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { Instances } from "engine/shared/fixes/Instances";
import type { Theme, ThemeKey } from "client/Theme";

@injectable
export class ThemeAutoSetter extends HostedService {
	constructor(@inject theme: Theme) {
		super();

		for (const instance of CollectionService.GetTagged("THEME_SETTER")) {
			const key = instance.GetAttribute("key") as keyof Instance;
			const value = instance.GetAttribute("value") as ThemeKey;

			$log("Auto theming", Instances.pathOf(instance.Parent!), key, value);

			(instance.Parent as Writable<Instance>)[key] = theme.get(value).get() as never;
			instance.Destroy();
		}
	}
}
