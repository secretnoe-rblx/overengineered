import { Players, RunService, Workspace } from "@rbxts/services";
import { BeaconController } from "client/controller/BeaconController";
import { CameraController } from "client/controller/CameraController";
import { ChatController } from "client/controller/ChatController";
import { DayCycleController } from "client/controller/DayCycleController";
import { DistanceHideController } from "client/controller/DistanceHideController";
import { EnvBlacklistsController } from "client/controller/EnvBlacklistsController";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { GraphicsSettingsController } from "client/controller/GraphicsSettingsController";
import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { OtherPlayersController } from "client/controller/OtherPlayersController";
import { RagdollController } from "client/controller/RagdollController";
import { MusicController } from "client/controller/sound/MusicController";
import { SoundController } from "client/controller/SoundController";
import { UpdatePopupController } from "client/controller/UpdatePopupController";
import { ActionsGui } from "client/gui/ActionsGui";
import { AdminGui } from "client/gui/AdminGui";
import { GuiAutoScaleController } from "client/gui/GuiAutoScaleController";
import { HideInterfaceController } from "client/gui/HideInterfaceController";
import { ControlsPopup } from "client/gui/popup/ControlsPopup";
import { NewSettingsPopup } from "client/gui/popup/NewSettingsPopup";
import { ReportSubmitController } from "client/gui/popup/ReportSubmitPopup";
import { SavePopup } from "client/gui/popup/SavePopup";
import { SettingsPopup } from "client/gui/popup/SettingsPopup";
import { WikiPopup } from "client/gui/popup/WikiPopup";
import { Keybinds } from "client/Keybinds";
import { ClientBuildingValidationController } from "client/modes/build/ClientBuildingValidationController";
import { PlayModeController } from "client/modes/PlayModeController";
import { PlayerDataInitializer } from "client/PlayerDataStorage";
import { TerrainController } from "client/terrain/TerrainController";
import { BasicCarTutorial } from "client/tutorial/tutorials/BasicCarTutorial";
import { BasicPlaneTutorial } from "client/tutorial/tutorials/BasicPlaneTutorial";
import { NewBasicPlaneTutorial } from "client/tutorial/tutorials/NewBasicPlaneTutorial";
import { TestTutorial } from "client/tutorial/tutorials/TestTutorial";
import { TutorialServiceInitializer } from "client/tutorial/TutorialService";
import { ReadonlyPlot } from "shared/building/ReadonlyPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RemoteEvents } from "shared/RemoteEvents";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import type { TutorialDescriber } from "client/tutorial/TutorialController";
import type { SharedPlot } from "shared/building/SharedPlot";
import type { GameHostBuilder } from "shared/GameHostBuilder";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		PlayerDataInitializer.initialize(builder);

		LoadingController.show("Pre-init");
		LocalPlayerController.initializeDisablingFluidForces(builder);
		LocalPlayerController.initializeSprintLogic(builder, RunService.IsStudio() ? 200 : 60);
		LocalPlayerController.initializeCameraMaxZoomDistance(builder, 512);
		OtherPlayersController.initializeMassless(builder);
		builder.services.registerService(RagdollController);
		RemoteEvents.initializeVisualEffects(builder);

		LoadingController.show("Waiting for server");
		while (!(Workspace.HasTag("GameLoaded") as boolean | undefined)) {
			task.wait();
		}

		builder.services.registerSingletonClass(Keybinds);
		builder.services.registerSingletonFunc(() => SharedPlots.initialize());

		LoadingController.show("Waiting for plot");
		builder.services.registerSingletonFunc((ctx) =>
			ctx.resolve<SharedPlots>().waitForPlot(Players.LocalPlayer.UserId),
		);
		builder.services.registerSingletonFunc((ctx): ReadonlyPlot => {
			const plot = ctx.resolve<SharedPlot>();
			return new ReadonlyPlot(plot.instance.Blocks, plot.getCenter(), plot.bounds);
		});

		builder.services.registerSingletonValue(CreateSandboxBlocks());
		PlayModeController.initialize(builder);
		ClientBuildingValidationController.initialize(builder);

		builder.services.registerService(GameEnvironmentController);
		builder.services.registerService(EnvBlacklistsController);
		SoundController.initializeAll(builder);
		builder.services.registerService(DistanceHideController);
		AdminGui.initializeIfAdminOrStudio(builder);

		builder.services.registerService(DayCycleController);
		builder.services.registerService(BeaconController);
		builder.services.registerService(GraphicsSettingsController);
		builder.services.registerService(CameraController);
		builder.services.registerService(TerrainController);
		builder.services.registerService(MusicController);
		builder.services.registerService(GuiAutoScaleController);
		builder.services.registerService(HideInterfaceController);
		ActionsGui.initialize(builder);

		if (!RunService.IsStudio()) {
			builder.services.registerService(UpdatePopupController);
		}

		ChatController.initializeAdminPrefix();
		SettingsPopup.addAsService(builder);
		NewSettingsPopup.addAsService(builder);
		SavePopup.addAsService(builder);
		ControlsPopup.addAsService(builder);
		WikiPopup.addAsService(builder);
		builder.services.registerSingletonClass(ReportSubmitController);

		{
			const tutorials: (new (...args: any[]) => TutorialDescriber)[] = [
				BasicCarTutorial,
				NewBasicPlaneTutorial,
				BasicPlaneTutorial,
			];
			if (GameDefinitions.isAdmin(Players.LocalPlayer)) {
				tutorials.push(TestTutorial);
			}

			TutorialServiceInitializer.initialize(builder, {
				tutorials,
				tutorialToRunWhenNoSlots: NewBasicPlaneTutorial,
			});
		}

		LoadingController.show("Initializing something");
	}
}
