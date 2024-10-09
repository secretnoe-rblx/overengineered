import { Workspace } from "@rbxts/services";

/** Class for working with local networking signals */
export namespace Signals {
	export namespace CAMERA {
		export const MOVED = (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame");
	}
}
