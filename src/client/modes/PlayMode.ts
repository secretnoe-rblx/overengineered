import { Component } from "engine/shared/component/Component";

export abstract class PlayMode extends Component {
	abstract getName(): PlayModes;
	abstract onSwitchToNext(mode: PlayModes | undefined): void;
	abstract onSwitchFromPrev(prev: PlayModes | undefined): void;
	onImmediateSwitchToNext(mode: PlayModes | undefined): void {}
	onImmediateSwitchFromPrev(prev: PlayModes | undefined): void {}
}
