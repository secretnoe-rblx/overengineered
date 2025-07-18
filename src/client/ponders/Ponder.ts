import { UserInputService, Workspace } from "@rbxts/services";
import { BlockWiresMarkers } from "client/gui/buildmode/BlockWiresGui";
import { ServiceIntegrityChecker } from "client/integrity/ServiceIntegrityChecker";
import { Control } from "engine/client/gui/Control";
import { Interface } from "engine/client/gui/Interface";
import { LocalPlayer } from "engine/client/LocalPlayer";
import { Component } from "engine/shared/component/Component";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { ReplicatedAssets } from "shared/ReplicatedAssets";
import type { BlockLogicTypes } from "shared/blockLogic/BlockLogicTypes";

interface PonderPart {
	readonly runFrame: (time: number) => void;
}

export class PonderBuilder {
	readonly parts: PonderPart[] = [];
	private readonly blocks: { [k in string]: BlockModel } = {};
	private readonly markers: { [k in string]: BlockWiresMarkers.Marker } = {};
	maxTime = 0;
	size = 4;

	constructor(
		private readonly ponder: Ponder,
		private readonly blockList: BlockList,
	) {}

	setPlotSize(studs: number): this {
		this.ponder.base.Size = new Vector3(studs, 1, studs);
		return this;
	}

	//

	placeBlock(startTime: number, uid: string, id: BlockId, position: CFrame, duration?: number): this {
		this.maxTime = math.max(this.maxTime, startTime + (duration ?? 0));
		const b = this.blockList.blocks[id];
		if (!b) throw "what";

		const model = b.model.Clone();
		this.blocks[uid] = model;
		model.Name = uid;
		model.PrimaryPart!.Anchored = true;
		model.PivotTo(
			this.ponder.base
				.GetPivot()
				.ToWorldSpace(position)
				.add(new Vector3(0, 1, 0)),
		);

		this.parts.push({
			runFrame: (time) => {
				model.Parent =
					time - startTime > 0 && time - startTime < (duration ?? 9999999) ? this.ponder.base : undefined;
			},
		});

		return this;
	}

	createMarker(
		startTime: number,
		mid: string,
		uid: string,
		markerType: "output" | "input",
		name: string,
		types: readonly (keyof BlockLogicTypes.Primitives)[],
		duration: number,
	): this {
		this.maxTime = math.max(this.maxTime, startTime + duration);
		const block = this.blocks[uid];
		if (!block) throw "what";

		const marker = new (markerType === "output" ? BlockWiresMarkers.Output : BlockWiresMarkers.Input)(
			block,
			BlockWiresMarkers.Input.createInstance(block.PrimaryPart!, "center", undefined, block.PrimaryPart!),
			name,
			new ObservableValue(types),
		);
		marker.tooltipsAlwaysVisible.set(true);
		this.markers[mid] = marker;
		this.ponder.parent(marker);

		this.parts.push({
			runFrame: (time) => {
				marker.setEnabled(time - startTime > 0 && time - startTime < duration);
			},
		});

		return this;
	}

	connectMarkers(startTime: number, idOutput: string, idInput: string, duration: number): this {
		this.maxTime = math.max(this.maxTime, startTime + duration);
		const output = this.markers[idOutput];
		if (!output) throw "what";
		if (!(output instanceof BlockWiresMarkers.Output)) throw "Output marker is not actually output";

		const input = this.markers[idInput];
		if (!input) throw "what";
		if (!(input instanceof BlockWiresMarkers.Input)) throw "Input marker is not actually input";

		this.parts.push({
			runFrame: (time) => {
				(input as BlockWiresMarkers.Input).setConnectedTo(
					time - startTime > 0 && time - startTime < duration
						? (output as BlockWiresMarkers.Output)
						: undefined,
				);
			},
		});

		return this;
	}

	highlightBlock(startTime: number, uid: string, text?: string, duration = 4): this {
		this.maxTime = math.max(this.maxTime, startTime + duration);
		const highlight = this.ponder.gui.highlight(this.blocks[uid], text);

		this.parts.push({
			runFrame: (time) => {
				highlight.Visible = time - startTime > 0 && time - startTime < duration;
			},
		});

		return this;
	}
	text(startTime: number, text: string, position?: Vector2, duration = 4): this {
		this.maxTime = math.max(this.maxTime, startTime + duration);
		const gui = this.ponder.gui.text(text, position);

		this.parts.push({
			runFrame: (time) => {
				gui.Visible = time - startTime > 0 && time - startTime < duration;
			},
		});

		return this;
	}
}

const guiTemplate = Interface.getPlayerGui().WaitForChild("Ponders") as PonderProgressGuiDefinition;
guiTemplate.Enabled = false;
type PonderProgressGuiDefinition = ScreenGui & {
	readonly Text: GuiObject & {
		readonly TextLabel: TextLabel;
	};
	readonly Highlight: GuiObject & {
		readonly Text: GuiObject & {
			readonly TextLabel: TextLabel;
		};
	};
	readonly Progress: GuiObject & {
		readonly Progress: GuiObject & {
			readonly Filled: GuiObject;
		};
		readonly Buttons: GuiObject & {
			readonly PauseButton: TextButton;
			readonly ExitButton: TextButton;
		};
	};
};
class PonderProgressGui extends InstanceComponent<PonderProgressGuiDefinition> {
	readonly highlightTemplate;
	readonly textTemplate;

	constructor(ponder: Ponder) {
		const gui = guiTemplate.Clone();
		gui.Enabled = true;
		gui.Parent = Interface.getPlayerGui();

		ServiceIntegrityChecker.whitelistInstance(gui);
		super(gui);

		this.highlightTemplate = this.asTemplate(gui.Highlight);
		this.textTemplate = this.asTemplate(gui.Text);

		const pause = this.parent(new Control(gui.Progress.Buttons.PauseButton)) //
			.addButtonAction(() => {
				ponder.isPaused.toggle();
				if (!ponder.isPaused.get() && ponder.progressSec.get() >= ponder.builder.maxTime) {
					ponder.progressSec.set(0);
				}
			});
		ponder.isPaused.subscribe((isp) => (pause.instance.Text = isp ? ">" : "||"), true);

		this.parent(new Control(gui.Progress.Buttons.ExitButton)) //
			.addButtonAction(() => ponder.destroy());

		ponder.progressSec.subscribe(
			(progress) => (gui.Progress.Progress.Filled.Size = new UDim2(progress / ponder.builder.maxTime, 0, 1, 0)),
			true,
		);

		const updateProgressFromInput = (input: InputObject) => {
			if (!UserInputService.IsMouseButtonPressed(Enum.UserInputType.MouseButton1)) return;

			const progress =
				((input.Position.X - gui.Progress.Progress.AbsolutePosition.X) / gui.Progress.Progress.AbsoluteSize.X) *
				ponder.builder.maxTime;
			ponder.progressSec.set(progress);

			ponder.runFrame();
		};
		gui.Progress.Progress.InputBegan.Connect(updateProgressFromInput);
		gui.Progress.Progress.InputChanged.Connect(updateProgressFromInput);
		gui.Progress.Progress.InputEnded.Connect(updateProgressFromInput);
	}

	highlight(model: Model, text?: string) {
		const getModelScreenBoundingBox = (model: Model): LuaTuple<[Vector2, Vector2]> | LuaTuple<[]> => {
			const camera = Workspace.CurrentCamera;
			if (!camera) return $tuple();

			const parts = model.GetDescendants().filter((desc): desc is BasePart => desc.IsA("BasePart"));
			if (parts.size() === 0) return $tuple();

			const screenPoints = new Array<Vector2>();

			for (const part of parts) {
				const size = part.Size.div(2);
				const corners = [
					new Vector3(-size.X, -size.Y, -size.Z),
					new Vector3(size.X, -size.Y, -size.Z),
					new Vector3(-size.X, size.Y, -size.Z),
					new Vector3(size.X, size.Y, -size.Z),
					new Vector3(-size.X, -size.Y, size.Z),
					new Vector3(size.X, -size.Y, size.Z),
					new Vector3(-size.X, size.Y, size.Z),
					new Vector3(size.X, size.Y, size.Z),
				];

				for (const corner of corners) {
					const worldCorner = part.CFrame.mul(corner);
					const [screenPos, onScreen] = camera.WorldToViewportPoint(worldCorner);
					if (onScreen) {
						screenPoints.push(new Vector2(screenPos.X, screenPos.Y));
					}
				}
			}

			if (screenPoints.size() === 0) return $tuple();

			let minX = math.huge;
			let minY = math.huge;
			let maxX = -math.huge;
			let maxY = -math.huge;

			for (const pt of screenPoints) {
				if (pt.X < minX) minX = pt.X;
				if (pt.Y < minY) minY = pt.Y;
				if (pt.X > maxX) maxX = pt.X;
				if (pt.Y > maxY) maxY = pt.Y;
			}

			const topLeft = new Vector2(minX, minY);
			const bottomRight = new Vector2(maxX, maxY);
			return $tuple(topLeft, bottomRight);
		};

		const ui = this.highlightTemplate();
		ui.Parent = this.instance;
		this.onDestroy(() => ui.Destroy());

		if (text) {
			ui.Text.TextLabel.Text = text;
		}

		const sub = this.event.loop(0, () => {
			while (true as boolean) {
				const [bb0, bb1] = getModelScreenBoundingBox(model);
				if (!bb0 || !bb1) {
					task.wait();
					continue;
				}

				ui.Position = new UDim2(0, bb0.X, 0, bb0.Y);
				ui.Size = new UDim2(0, bb1.X - bb0.X, 0, bb1.Y - bb0.Y);

				task.wait();
			}
		});
		ui.Destroying.Connect(() => sub.Disconnect());

		return ui;
	}
	text(text: string, position?: Vector2, deletionDelay = 4) {
		const ui = this.textTemplate();
		ui.Parent = this.instance;
		this.onDestroy(() => ui.Destroy());

		if (position) {
			ui.Position = new UDim2(position.X, 0, position.Y, 0);
		}

		ui.TextLabel.Text = text;
		return ui;
	}
}

export class Ponder extends Component {
	readonly builder: PonderBuilder;

	readonly isPaused = new ObservableValue(false);
	readonly progressSec = new ObservableValue(0);
	readonly gui: PonderProgressGui;
	readonly base;

	constructor(position: CFrame, blockList: BlockList) {
		super();

		this.builder = new PonderBuilder(this, blockList);
		this.gui = this.parent(new PonderProgressGui(this));

		const base = ReplicatedAssets.waitForAsset<BasePart>("Ponders", "Floor").Clone();
		this.base = base;
		base.Anchored = true;
		base.PivotTo(position);
		base.Parent = Workspace;

		this.onDestroy(() => {
			Workspace.CurrentCamera!.CameraSubject = LocalPlayer.humanoid.get();
			LocalPlayer.getPlayerModule().GetControls().Enable();
			base.Destroy();
		});
	}

	runFrame() {
		const time = this.progressSec.get();
		if (time > this.builder.maxTime) return;

		for (const part of this.builder.parts) {
			part.runFrame(time);
		}
	}

	run() {
		Workspace.CurrentCamera!.CFrame = CFrame.lookAt(Vector3.one, Vector3.zero);
		Workspace.CurrentCamera!.CameraSubject = this.base;
		LocalPlayer.getPlayerModule().GetControls().Disable();

		this.event.loop(0, (dt) => {
			if (this.isPaused.get()) {
				return;
			}

			if (this.progressSec.get() > this.builder.maxTime) {
				this.isPaused.set(true);
				return;
			}

			this.runFrame();
			this.progressSec.set(this.progressSec.get() + dt);
		});
	}
}
