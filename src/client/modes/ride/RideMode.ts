import { ClientMachine } from "client/blocks/ClientMachine";
import { SoundController } from "client/controller/SoundController";
import { Gui } from "client/gui/Gui";
import { RideModeScene } from "client/gui/ridemode/RideModeScene";
import { PlayMode } from "client/modes/PlayMode";
import { CustomRemotes } from "shared/Remotes";
import type { RideModeSceneDefinition } from "client/gui/ridemode/RideModeScene";
import type { PlayerDataStorage } from "client/PlayerDataStorage";
import type { SharedPlot } from "shared/building/SharedPlot";

@injectable
export class RideMode extends PlayMode {
	private currentMachine?: ClientMachine;
	private readonly rideModeScene;

	constructor(
		@inject private readonly plot: SharedPlot,
		@inject playerData: PlayerDataStorage,
		@inject private readonly di: DIContainer,
	) {
		super();

		this.rideModeScene = new RideModeScene(
			Gui.getGameUI<{ RideMode: RideModeSceneDefinition }>().RideMode,
			playerData,
		);
		this.parentGui(this.rideModeScene);

		CustomRemotes.modes.set.sent.Connect((mode) => {
			if (mode === "ride") return;
			if (!this.currentMachine) return;

			this.currentMachine.getImpactController()?.disable();
		});

		const alignPositionInstance = new Instance("AlignPosition");
		alignPositionInstance.Mode = Enum.PositionAlignmentMode.OneAttachment;
		alignPositionInstance.MaxForce = math.huge;
		alignPositionInstance.MaxVelocity = math.huge;
		alignPositionInstance.Responsiveness = 200;

		const alignOrientationInstance = new Instance("AlignOrientation");
		alignOrientationInstance.Mode = Enum.OrientationAlignmentMode.OneAttachment;
		alignOrientationInstance.MaxAngularVelocity = math.huge;
		alignOrientationInstance.MaxTorque = math.huge;
		alignOrientationInstance.Responsiveness = 200;

		CustomRemotes.physics.normalizeRootparts.invoked.Connect((data) => {
			for (const part of data.parts) {
				const attachment = new Instance("Attachment", part);

				const alignPosition = alignPositionInstance.Clone();
				const alignOrientation = alignOrientationInstance.Clone();

				alignPosition.Attachment0 = attachment;
				alignOrientation.Attachment0 = attachment;

				alignPosition.Parent = part;
				alignOrientation.Parent = part;
			}
		});
	}

	getName(): PlayModes {
		return "ride";
	}

	getCurrentMachine() {
		return this.currentMachine;
	}

	onImmediateSwitchToNext(mode: PlayModes | undefined): void {
		this.currentMachine?.destroy();
		this.currentMachine = undefined;
	}

	onSwitchToNext(mode: PlayModes | undefined) {}
	onSwitchFromPrev(prev: PlayModes | undefined) {
		if (prev === undefined) {
			//
		} else if (prev === "build") {
			this.currentMachine = this.di.resolveForeignClass(ClientMachine);
			this.currentMachine.init(this.plot.getBlockDatas());

			SoundController.getSounds().Start.Play();
			this.rideModeScene.start(this.currentMachine);
		}
	}
}
