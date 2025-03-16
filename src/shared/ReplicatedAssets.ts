import { ReplicatedStorage } from "@rbxts/services";
import { Instances } from "engine/shared/fixes/Instances";

export namespace ReplicatedAssets {
	export const assets = ReplicatedStorage.WaitForChild("Assets") as Folder;

	export function get<T = Instance>(): T {
		return assets as T;
	}

	export function findAsset<T = Instance>(...path: string[]): T | undefined {
		return Instances.findChild(assets, ...path);
	}
	export function waitForAsset<T = Instance>(...path: string[]): T {
		return Instances.waitForChild(assets, ...path);
	}
}
