import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { ButtonControl } from "client/gui/controls/Button";
import { Interface } from "client/gui/Interface";
import { ClientComponent } from "engine/client/component/ClientComponent";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { ComponentInstance } from "engine/shared/component/ComponentInstance";
import { Transforms } from "engine/shared/component/Transforms";
import { Element } from "engine/shared/Element";
import { ObservableSwitch } from "engine/shared/event/ObservableSwitch";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { Colors } from "shared/Colors";
import { CustomRemotes } from "shared/Remotes";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { ActionController } from "client/modes/build/ActionController";

type CM = readonly [pos: Vector3, mass: number];
const weightedAverage = (values: readonly CM[]) => {
	const sum = values.reduce((acc, [pos, weight]) => acc.add(pos.mul(weight)), Vector3.zero);
	const totalMass = values.reduce((acc, [, weight]) => acc + weight, 0);

	return sum.div(totalMass);
};

@injectable
export class CenterOfMassVisualizer extends Component {
	private readonly viewportFrame: ViewportFrame;

	private renderedBalls: Model[] = [];
	private machineCOM: Model | undefined;

	constructor(parent: Instance, @inject actionController: ActionController) {
		super();

		this.viewportFrame = Element.create("ViewportFrame", {
			Name: "WireViewportFrame",
			Size: UDim2.fromScale(1, 1),
			CurrentCamera: Workspace.CurrentCamera,
			Transparency: 1,
			Ambient: Colors.white,
			LightColor: Colors.white,
			ZIndex: -1000,
			Parent: Interface.getGameUI(),
		});
		ComponentInstance.init(this, this.viewportFrame);

		const update = () => {
			if (!this.machineCOM) {
				this.machineCOM = ReplicatedStorage.Assets.CenterOfMassMachine.Clone();
				this.machineCOM.Parent = this.viewportFrame;
			}

			const blocks = parent.GetChildren() as BlockModel[];
			const pos = this.calculateCentersOfMass(blocks);

			if (pos.size() > this.renderedBalls.size()) {
				for (let i = 0; i < pos.size() - this.renderedBalls.size(); i++)
					this.renderedBalls.push(ReplicatedStorage.Assets.CenterOfMassAssembly.Clone());
			}

			if (pos.size() < this.renderedBalls.size()) {
				while (this.renderedBalls.size() > pos.size()) {
					const index = this.renderedBalls.size() - 1;
					this.renderedBalls[index].Destroy();
					this.renderedBalls.remove(index);
				}
			}

			//let machineCOMpost = new Vector3(0, 0, 0);

			for (let i = 0; i < pos.size(); i++) {
				const ball = this.renderedBalls[i];
				ball.Parent = this.viewportFrame;
				ball.PivotTo(new CFrame(pos[i][0]));
				//machineCOMpost = machineCOMpost.add(pos[i]);
			}

			const weightedAverage = (values: readonly CM[]) => {
				const sum = values.reduce((acc, [pos, weight]) => acc.add(pos.mul(weight)), Vector3.zero);
				const totalMass = values.reduce((acc, [, weight]) => acc + weight, 0);

				return sum.div(totalMass);
			};

			//average pos divided by amount of CoMs
			//this.machineCOM?.PivotTo(new CFrame(machineCOMpost.div(pos.size()))); //<---- nesting hell :D
			this.machineCOM?.PivotTo(new CFrame(weightedAverage(pos)));
		};

		const clear = () => {
			for (const b of this.renderedBalls) b.Destroy();
			this.machineCOM?.Destroy();
			this.machineCOM = undefined;

			this.renderedBalls.clear();
		};

		this.event.subscribe(actionController.onRedo, update);
		this.event.subscribe(actionController.onUndo, update);
		this.event.subscribe(CustomRemotes.slots.load.sent, clear);
		this.event.subscribe(CustomRemotes.slots.load.completed, (v) => (v.success ? update() : undefined));
		this.event.subscribe(SharedPlot.anyChanged, update);

		this.onEnabledStateChange((enabled) => {
			if (enabled) update();
			else clear();
		});
	}

	private calculateCentersOfMass(blocks: readonly BlockModel[]): readonly CM[] {
		const partsInUse: Set<BlockModel> = new Set();
		const ass: CM[] = [];

		// ACTUALLY WRONG; returns the center of every part inside but they're not weighted; but who cares
		const getBlockMass = (block: BlockModel): LuaTuple<[pos: Vector3, mass: number]> => {
			let mass = 0;
			let center = Vector3.zero;
			let amount = 0;

			for (const part of block.GetDescendants()) {
				if (part.IsA("BasePart") && !part.Massless) {
					amount++;

					mass += part.Mass;
					center = center.add(part.Position);
				}
			}

			return $tuple(center.div(amount), mass);
		};
		// ACTUALLY WRONG; returns the center of every part inside but they're not weighted; but who cares
		const getAssemblyMass = (asm: readonly BlockModel[]): LuaTuple<[pos: Vector3, mass: number]> => {
			let mass = 0;
			let center = Vector3.zero;

			for (const b of asm) {
				const [c, m] = getBlockMass(b);
				mass += m;
				center = center.add(c);
			}

			return $tuple(center.div(asm.size()), mass);
		};

		for (const block of blocks) {
			if (partsInUse.has(block)) continue;

			const assembly = BuildingManager.getAssemblyBlocks(block);
			for (const b of assembly) {
				partsInUse.add(b);
			}

			const vectorSum = weightedAverage(assembly.map((b) => [...getBlockMass(b)] as unknown as CM));
			ass.push([vectorSum, getAssemblyMass(assembly)[1]]);
		}

		return ass;
	}
}

@injectable
export class CenterOfMassController extends ClientComponent {
	constructor(
		@inject mainScreen: MainScreenLayout,
		@inject plot: SharedPlot,
		@inject actionController: ActionController,
	) {
		super();

		const visualizerContainer = new ComponentChild<CenterOfMassVisualizer>(this);
		const enabled = new ObservableSwitch();

		this.event.subscribeObservable(
			enabled,
			(enabled) => {
				if (enabled) {
					visualizerContainer.set(new CenterOfMassVisualizer(plot.getBlocks()[0].Parent!, actionController));
				} else {
					visualizerContainer.clear();
				}
			},
			true,
		);

		{
			enabled.set("button", false);
			const button = mainScreen.registerTopRightButton("CenterOfMass");
			this.onEnabledStateChange((enabled) => button.visible.set("main_visible", enabled), true);

			const com = this.parent(
				new ButtonControl(button.instance, () => enabled.set("button", !enabled.getKeyed("button"))),
			);

			this.event.subscribeObservable(
				enabled,
				(enabled) =>
					Transforms.create()
						.transform(com.instance, "Transparency", enabled ? 0 : 0.5, Transforms.commonProps.quadOut02)
						.run(com.instance),
				true,
			);
		}
	}
}
