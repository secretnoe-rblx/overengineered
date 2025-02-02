import { Players, RunService, Workspace } from "@rbxts/services";
import { BeaconController } from "client/controller/BeaconController";
import { BlurController } from "client/controller/BlurController";
import { CameraController } from "client/controller/CameraController";
import { ChatController } from "client/controller/ChatController";
import { DayCycleController } from "client/controller/DayCycleController";
import { DistanceHideController } from "client/controller/DistanceHideController";
import { EnvBlacklistsController } from "client/controller/EnvBlacklistsController";
import { GameEnvironmentController } from "client/controller/GameEnvironmentController";
import { GraphicsSettingsController } from "client/controller/GraphicsSettingsController";
import { LoadingController } from "client/controller/LoadingController";
import { LocalPlayerController } from "client/controller/LocalPlayerController";
import { ObstaclesController } from "client/controller/ObstaclesController";
import { OtherPlayersController } from "client/controller/OtherPlayersController";
import { RagdollController } from "client/controller/RagdollController";
import { MusicController } from "client/controller/sound/MusicController";
import { SoundController } from "client/controller/SoundController";
import { UpdatePopupController } from "client/controller/UpdatePopupController";
import { AdminGui } from "client/gui/AdminGui";
import { FpsCounterController } from "client/gui/FpsCounterController";
import { GuiAutoScaleController } from "client/gui/GuiAutoScaleController";
import { HideInterfaceController } from "client/gui/HideInterfaceController";
import { MainScene } from "client/gui/MainScene";
import { MainScreenLayout } from "client/gui/MainScreenLayout";
import { ControlsPopup } from "client/gui/popup/ControlsPopup";
import { ReportSubmitController } from "client/gui/popup/ReportSubmitPopup";
import { SavePopup } from "client/gui/popup/SavePopup";
import { WikiPopup } from "client/gui/popup/WikiPopup";
import { PopupController } from "client/gui/PopupController";
import { RainbowGuiController } from "client/gui/RainbowGuiController";
import { ActionController } from "client/modes/build/ActionController";
import { ClientBuildingValidationController } from "client/modes/build/ClientBuildingValidationController";
import { PlayModeController } from "client/modes/PlayModeController";
import { PlayerDataInitializer } from "client/PlayerDataStorage";
import { TerrainController } from "client/terrain/TerrainController";
import { Theme } from "client/Theme";
import { ThemeAutoSetter } from "client/ThemeAutoSetter";
import { ToolController } from "client/tools/ToolController";
import { BasicCarTutorial } from "client/tutorial/tutorials/BasicCarTutorial";
import { BasicPlaneTutorial } from "client/tutorial/tutorials/BasicPlaneTutorial";
import { NewBasicPlaneTutorial } from "client/tutorial/tutorials/NewBasicPlaneTutorial";
import { TestTutorial } from "client/tutorial/tutorials/TestTutorial";
import { TutorialServiceInitializer } from "client/tutorial/TutorialService";
import { Keybinds } from "engine/client/Keybinds";
import { ReadonlyPlot } from "shared/building/ReadonlyPlot";
import { SharedPlots } from "shared/building/SharedPlots";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { RemoteEvents } from "shared/RemoteEvents";
import { CreateSandboxBlocks } from "shared/SandboxBlocks";
import type { TutorialDescriber } from "client/tutorial/TutorialController";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";
import type { SharedPlot } from "shared/building/SharedPlot";

export namespace SandboxGame {
	export function initialize(builder: GameHostBuilder) {
		LoadingController.run("Pre-init", () => {
			PlayerDataInitializer.initialize(builder);

			LocalPlayerController.initializeDisablingFluidForces(builder);
			LocalPlayerController.initializeSprintLogic(builder);
			LocalPlayerController.initializeCameraMaxZoomDistance(builder, 512);
			OtherPlayersController.initializeMassless(builder);
			builder.services.registerService(RagdollController);
			RemoteEvents.initializeVisualEffects(builder);
			builder.services.registerSingletonValue(ActionController.instance);

			builder.services.registerSingletonClass(Theme);
			builder.services.registerService(ThemeAutoSetter);
		});

		LoadingController.run("Waiting for server", () => {
			while (!(Workspace.HasTag("GameLoaded") as boolean | undefined)) {
				task.wait();
			}
		});

		builder.services.registerSingletonClass(Keybinds);
		builder.services.registerSingletonFunc(() => SharedPlots.initialize());

		builder.services.registerSingletonFunc((ctx) =>
			ctx.resolve<SharedPlots>().waitForPlot(Players.LocalPlayer.UserId),
		);

		builder.services.registerSingletonFunc((ctx): ReadonlyPlot => {
			const plot = ctx.resolve<SharedPlot>();
			return new ReadonlyPlot(plot.instance.Blocks, plot.getCenter(), plot.bounds);
		});

		builder.services.registerSingletonFunc(CreateSandboxBlocks);
		PlayModeController.initialize(builder);
		ClientBuildingValidationController.initialize(builder);

		builder.services.registerService(MainScene);
		builder.services.registerService(ToolController);

		builder.services.registerService(GameEnvironmentController);
		builder.services.registerService(EnvBlacklistsController);
		SoundController.initializeAll(builder);
		builder.services.registerService(DistanceHideController);
		builder.services.registerService(ObstaclesController);
		AdminGui.initializeIfAdminOrStudio(builder);

		builder.services.registerService(DayCycleController);
		builder.services.registerService(BeaconController);
		builder.services.registerService(GraphicsSettingsController);
		builder.services.registerService(CameraController);
		builder.services.registerService(TerrainController);
		builder.services.registerService(MusicController);
		builder.services.registerService(GuiAutoScaleController);
		builder.services.registerService(HideInterfaceController);
		// builder.services.registerService(WeaponModuleSystem); //weapons test
		builder.services.registerService(FpsCounterController);
		builder.services.registerService(RainbowGuiController);
		builder.services.registerService(BlurController);
		builder.services
			.registerSingletonClass(MainScreenLayout)
			.autoInit()
			.onInit((c) => c.enable());

		if (!RunService.IsStudio()) {
			builder.services.registerService(UpdatePopupController);
		}

		ChatController.initializeAdminPrefix();
		builder.services.registerService(PopupController);
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
	}
}
