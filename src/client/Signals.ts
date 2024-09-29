import { Workspace } from "@rbxts/services";
import { Signal } from "engine/shared/event/Signal";

/** Class for working with local networking signals */
export namespace Signals {
	export namespace CAMERA {
		export const MOVED = (Workspace.CurrentCamera as Camera).GetPropertyChangedSignal("CFrame");
	}

	export namespace PLAYER {
		export const SPAWN = new Signal();
		export const DIED = new Signal();
	}

	export const LOCAL_PLAY_MODE_CHANGED = new Signal<(mode: PlayModes) => void>();
}
