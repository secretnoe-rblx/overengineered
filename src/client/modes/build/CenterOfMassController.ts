import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { ClientComponent } from "client/component/ClientComponent";
import { Gui } from "client/gui/Gui";
import { BuildingManager } from "shared/building/BuildingManager";
import { SharedPlot } from "shared/building/SharedPlot";
import { Colors } from "shared/Colors";
import { CustomRemotes } from "shared/Remotes";

@injectable
export class CenterOfMassController extends ClientComponent {
	private readonly viewportFrame;
	private renderedBalls: Model[] = [];

	constructor(@inject plot: SharedPlot) {
		super();

		this.viewportFrame = new Instance("ViewportFrame");
		this.viewportFrame.Name = "WireViewportFrame";
		this.viewportFrame.Size = UDim2.fromScale(1, 1);
		this.viewportFrame.CurrentCamera = Workspace.CurrentCamera;
		this.viewportFrame.Transparency = 1;
		this.viewportFrame.Parent = Gui.getGameUI();
		this.viewportFrame.Ambient = Colors.white;
		this.viewportFrame.LightColor = Colors.white;
		this.viewportFrame.ZIndex = -1000;

		const update = () => {
			const blocks = plot.getBlocks();
			const pos = this.calculateCentersOfMass(blocks);

			print(pos.size(), this.renderedBalls.size());

			if (pos.size() > this.renderedBalls.size()) {
				for (let i = 0; i < pos.size() - this.renderedBalls.size(); i++)
					this.renderedBalls.push(ReplicatedStorage.Assets.CenterOfMass.Clone());
			}

			if (pos.size() < this.renderedBalls.size()) {
				while (this.renderedBalls.size() > pos.size()) {
					const index = this.renderedBalls.size() - 1;
					this.renderedBalls[index].Destroy();
					this.renderedBalls.remove(index);
				}
			}

			for (let i = 0; i < pos.size(); i++) {
				const ball = this.renderedBalls[i];
				ball.Parent = this.viewportFrame;
				ball.PivotTo(new CFrame(pos[i]));
			}
		};

		this.event.subscribe(CustomRemotes.slots.load.completed, (v) => (v.success ? update() : undefined));
		this.event.subscribe(SharedPlot.anyChanged, update);
		this.event.onEnable(update);
		this.onDisable(() => {
			for (const b of this.renderedBalls) b.Destroy();
			this.renderedBalls.clear();
		});
	}

	private calculateCentersOfMass(blocks: readonly BlockModel[]) {
		const partsInUse: Set<BlockModel> = new Set();
		const ass: Vector3[] = [];
		for (const block of blocks) {
			if (partsInUse.has(block)) continue;

			let result = new Vector3(0, 0, 0);
			const assembly = BuildingManager.getAssemblyBlocks(block);
			for (const b of assembly) {
				partsInUse.add(b);
				if (!b.PrimaryPart) continue;
				result = result.add(b.PrimaryPart.AssemblyCenterOfMass);
			}
			const length = assembly.size();
			ass.push(result.div(new Vector3(length, length, length)));
		}
		return ass;
	}
}
