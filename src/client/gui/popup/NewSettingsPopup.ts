import { PlayerSelectorColumnControl } from "client/gui/controls/PlayerSelectorListControl";
import { ToggleControl } from "client/gui/controls/ToggleControl";
import { Interface } from "client/gui/Interface";
import { Popup } from "client/gui/Popup";
import { ButtonControl } from "engine/client/gui/Button";
import { ComponentChildren } from "engine/shared/component/ComponentChildren";
import { CustomRemotes } from "shared/Remotes";
import type { PlayerSelectorColumnControlDefinition } from "client/gui/controls/PlayerSelectorListControl";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";
import type { SharedPlot } from "shared/building/SharedPlot";

export type NewSettingsPopupDefinition = GuiObject & {
	readonly Content: ScrollingFrame & NewSettingsScenes;
	readonly Heading: {
		readonly CloseButton: GuiButton;
		readonly TitleLabel: TextLabel;
	};
};

type ToggleRow = Frame & {
	readonly Toggle: TextButton & {
		readonly Circle: TextButton;
	};
};

type SliderRow = Frame & {
	readonly SliderControl: Frame & {
		readonly Filled: Frame;
		readonly Knob: Frame;
	};
	readonly ManualControl: TextBox;
};

export type NewSettingsScenes = {
	readonly Main: Frame & {};
	readonly Permissions: Frame & {
		readonly Blacklist: PlayerSelectorColumnControlDefinition;
		readonly IsolationMode: ToggleRow;
	};
	readonly Graphics: Frame & {
		readonly Effects: Frame & {
			readonly LocalShadows: ToggleRow;
			readonly OthersShadows: ToggleRow;
			readonly OthersEffects: ToggleRow;
		};
		readonly Camera: Frame & {
			readonly Improved: ToggleRow;
			readonly PlayerCentered: ToggleRow;
			readonly Strict: ToggleRow;
			readonly FieldOfView: SliderRow;
		};
	};
};

type Scenes = keyof NewSettingsScenes;

@injectable
export class NewSettingsPopup extends Popup<NewSettingsPopupDefinition> {
	static addAsService(host: GameHostBuilder) {
		const gui = Interface.getGameUI<{ Popup: { Crossplatform: { Settings: NewSettingsPopupDefinition } } }>().Popup
			.Crossplatform.Settings;
		host.services.registerTransientFunc((ctx) => ctx.resolveForeignClass(this, [gui.Clone()]));
	}

	private readonly sceneChildren;

	constructor(
		gui: NewSettingsPopupDefinition,
		@inject private readonly plot: SharedPlot,
	) {
		super(gui);

		this.sceneChildren = this.parent(new ComponentChildren().withParentInstance(gui));

		this.parent(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));
		this.setScene("Main");
	}

	loadScene(scene: Scenes) {
		this.sceneChildren.clear();

		if (scene === "Main") {
			// TODO: make this scene
			return;
		}

		if (scene === "Permissions") {
			const blacklistedPlayers = this.plot.blacklistedPlayers.get() ?? [];
			const blacklist = new PlayerSelectorColumnControl(
				this.instance.Content.Permissions.Blacklist,
				blacklistedPlayers,
			);
			const isolationMode = new ToggleControl(this.instance.Content.Permissions.IsolationMode.Toggle);
			isolationMode.value.set(this.plot.isolationMode.get() ?? false);

			blacklist.submitted.Connect((players) => {
				CustomRemotes.gui.settings.permissions.updateBlacklist.send(players);
			});

			isolationMode.value.subscribe((value) => {
				blacklist.setVisibleAndEnabled(!value);
				CustomRemotes.gui.settings.permissions.isolationMode.send(value);
			}, true);

			this.sceneChildren.add(blacklist);
			this.sceneChildren.add(isolationMode);
			return;
		}

		if (scene === "Graphics") {
			// TODO: make this scene
			return;
		}
	}

	setScene(scene: Scenes) {
		this.instance.Heading.TitleLabel.Text = scene.upper();

		for (const scene of this.instance.Content.GetChildren()) {
			(scene as GuiObject).Visible = false;
		}

		this.instance.Content[scene].Visible = true;

		this.loadScene(scene);
	}
}
