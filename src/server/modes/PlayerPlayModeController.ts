import { Component } from "engine/shared/component/Component";
import { ObservableValue } from "engine/shared/event/ObservableValue";

export interface ServerPlayerMode extends Component {
	readonly name: string;
}

@injectable
export class PlayerPlayModeController extends Component {
	readonly mode: ObservableValue<ServerPlayerMode>;

	constructor(@inject player: Player) {
		super();

		this.mode = new ObservableValue<ServerPlayerMode>(new PlayerIdleMode());
	}
}

export class PlayerIdleMode extends Component implements ServerPlayerMode {
	readonly name = "idle";
}

export class PlayerBuildMode extends Component implements ServerPlayerMode {
	readonly name = "build";

	constructor(player: Player) {
		super();

		this.onEnable(() => {
			const humanoid = player.Character?.FindFirstChild("Humanoid") as Humanoid | undefined;
			if (humanoid) humanoid.Health = humanoid.MaxHealth;
		});
	}
}
