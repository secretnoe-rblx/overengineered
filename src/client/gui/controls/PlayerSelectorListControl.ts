import { Players, RunService } from "@rbxts/services";
import { ButtonControl } from "engine/client/gui/Button";
import { Control } from "engine/client/gui/Control";
import { ComponentKeyedChildren } from "engine/shared/component/ComponentKeyedChildren";
import { Transforms } from "engine/shared/component/Transforms";
import { TransformService } from "engine/shared/component/TransformService";
import { ArgsSignal } from "engine/shared/event/Signal";
import { GameDefinitions } from "shared/data/GameDefinitions";

type FakePlayer = {
	readonly UserId: number;
	readonly DisplayName: string;
	readonly Name: string;
};

type PlayerContainerDefinition = Frame & {
	readonly TextButton: TextButton & {
		readonly ImageLabel: ImageLabel;
		readonly TitleLabel: TextLabel;
		readonly UsernameLabel: TextLabel;
	};
};
class PlayerContainer extends Control<PlayerContainerDefinition> {
	readonly clicked;

	constructor(
		gui: PlayerContainerDefinition,
		readonly player: FakePlayer,
	) {
		super(gui);

		gui.TextButton.TitleLabel.Text = player.DisplayName;
		gui.TextButton.UsernameLabel.Text = `@${player.Name}`;
		task.spawn(() => {
			gui.TextButton.ImageLabel.Image = Players.GetUserThumbnailAsync(
				player.UserId,
				Enum.ThumbnailType.HeadShot,
				Enum.ThumbnailSize.Size100x100,
			)[0];
		});

		const button = this.add(new ButtonControl(gui.TextButton));
		this.clicked = button.activated;
	}
}

export type PlayerSelectorColumnControlDefinition = Frame & {
	readonly TextLabel: TextLabel;
	readonly Left: Frame & {
		readonly Container: PlayerContainerDefinition;
	};
	readonly Right: Frame;
};

export class PlayerSelectorColumnControl extends Control<PlayerSelectorColumnControlDefinition> {
	private readonly playerTemplate;
	private readonly addedPlayers;

	private readonly leftControl;
	private readonly rightControl;

	readonly submitted = new ArgsSignal<[players: readonly number[]]>();

	constructor(gui: PlayerSelectorColumnControlDefinition, addedPlayers: readonly number[]) {
		super(gui);

		this.playerTemplate = this.asTemplate(gui.Left.Container, true);
		this.leftControl = this.parent(
			new ComponentKeyedChildren<FakePlayer, PlayerContainer>().withParentInstance(gui.Left),
		);
		this.rightControl = this.parent(
			new ComponentKeyedChildren<FakePlayer, PlayerContainer>().withParentInstance(gui.Right),
		);
		this.addedPlayers = new Set(addedPlayers);

		this.onEnable(() => this.updateOnlinePlayers());
		this.event.subscribe(Players.PlayerAdded, (player) => this.addPlayer(player));
		this.event.subscribe(Players.PlayerRemoving, (player) => this.removePlayer(player));
	}

	updateOnlinePlayers() {
		this.leftControl.clear();
		this.rightControl.clear();

		for (const player of Players.GetPlayers()) {
			this.addPlayer(player);
		}
		// const pl: FakePlayer[] = [
		// ];
		// for (const player of pl) {
		// 	this.addPlayer(player);
		// }
	}
	private addPlayer(player: FakePlayer | Player) {
		if (player === Players.LocalPlayer) return;
		if (!RunService.IsStudio() && typeIs(player, "Instance") && GameDefinitions.isAdmin(player)) return;

		const control = new PlayerContainer(this.playerTemplate(), player);

		if (!this.addedPlayers.has(player.UserId)) {
			this.leftControl.add(player, control);
			TransformService.run(control.instance.TextButton, (tr, instance) =>
				tr
					.func(() => (instance.Visible = false))
					.transform(instance, "BackgroundTransparency", 1)
					.moveRelative(instance, new UDim2(0, -50, 0, 0))
					.wait(this.leftControl.getAll().size() * 0.05)
					.then()
					.func(() => (instance.Visible = true))
					.transform(instance, "BackgroundTransparency", 0, Transforms.commonProps.quadOut02)
					.moveRelative(instance, new UDim2(0, 50, 0, 0), Transforms.commonProps.quadOut02)
					.then()
					.func(() => {
						control.clicked.Connect(() => {
							this.addedPlayers.add(player.UserId);
							this.removePlayer(player);
							this.addPlayer(player);
							this.submitted.Fire([...this.addedPlayers]);
						});
					}),
			);
		} else {
			this.rightControl.add(player, control);
			TransformService.run(control.instance.TextButton, (tr, instance) =>
				tr
					.func(() => (instance.Visible = false))
					.transform(instance, "BackgroundTransparency", 1)
					.moveRelative(instance, new UDim2(0, 50, 0, 0))
					.wait(this.rightControl.getAll().size() * 0.05)
					.then()
					.func(() => (instance.Visible = true))
					.transform(instance, "BackgroundTransparency", 0, Transforms.commonProps.quadOut02)
					.moveRelative(instance, new UDim2(0, -50, 0, 0), Transforms.commonProps.quadOut02)
					.then()
					.func(() => {
						control.clicked.Connect(() => {
							this.addedPlayers.delete(player.UserId);
							this.removePlayer(player);
							this.addPlayer(player);
							this.submitted.Fire([...this.addedPlayers]);
						});
					}),
			);
		}
	}
	private removePlayer(player: FakePlayer) {
		const control = this.leftControl.get(player) ?? this.rightControl.get(player);
		if (!control) return;

		control.disable();
		control.instance.Interactable = false;

		if (this.leftControl.get(player)) {
			TransformService.run(control.instance.TextButton.TitleLabel, (tr, instance) =>
				tr.transform(instance, "TextTransparency", 1, Transforms.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton.UsernameLabel, (tr, instance) =>
				tr.transform(instance, "TextTransparency", 1, Transforms.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton.ImageLabel, (tr, instance) =>
				tr.transform(instance, "ImageTransparency", 1, Transforms.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton, (tr, instance) =>
				tr
					.moveRelative(instance, new UDim2(0, -50, 0, 0), Transforms.commonProps.quadOut02)
					.transform(instance, "BackgroundTransparency", 1, Transforms.commonProps.quadOut02)
					.then()
					.func(() => control.destroy()),
			);
		} else {
			TransformService.run(control.instance.TextButton.TitleLabel, (tr, instance) =>
				tr.transform(instance, "TextTransparency", 1, Transforms.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton.UsernameLabel, (tr, instance) =>
				tr.transform(instance, "TextTransparency", 1, Transforms.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton.ImageLabel, (tr, instance) =>
				tr.transform(instance, "ImageTransparency", 1, Transforms.commonProps.quadOut02),
			);
			TransformService.run(control.instance.TextButton, (tr, instance) =>
				tr
					.moveRelative(instance, new UDim2(0, 50, 0, 0), Transforms.commonProps.quadOut02)
					.transform(instance, "BackgroundTransparency", 1, Transforms.commonProps.quadOut02)
					.then()
					.func(() => control.destroy()),
			);
		}
	}
}
