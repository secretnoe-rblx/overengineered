import { Interface } from "client/gui/Interface";
import { Control } from "engine/client/gui/Control";
import { Component } from "engine/shared/component/Component";
import { ComponentChild } from "engine/shared/component/ComponentChild";
import { OverlayValueStorage } from "engine/shared/component/OverlayValueStorage";
import { ObservableValue } from "engine/shared/event/ObservableValue";
import { Signal } from "engine/shared/event/Signal";
import type { BuildTool } from "client/tools/BuildTool";
import type { ToolController } from "client/tools/ToolController";
import type { ReadonlyObservableValue } from "engine/shared/event/ObservableValue";
import type { ReadonlyPlot } from "shared/building/ReadonlyPlot";

class RequireTutorialPart extends Component {
	constructor(check: () => boolean, onFalse: () => Component, onTrue: () => Component) {
		super();

		const child = this.parent(new ComponentChild());
		this.event.subscribeRegistration(() =>
			Signal.connectionFromTask(
				task.spawn(() => {
					let state: boolean | undefined = undefined;
					while (true as boolean) {
						task.wait();

						const st = check();
						if (st === state) continue;
						state = st;

						if (!state) {
							child.set(onFalse());
						} else {
							child.set(onTrue());
						}
					}
				}),
			),
		);
	}
}

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
type SingleKey<T> = IsUnion<keyof T> extends true ? never : {} extends T ? never : T;

@injectable
export class TestTutorial2 extends Component {
	constructor(
		// @inject tutorial: TutorialController2,
		@inject plot: ReadonlyPlot,
		@inject toolController: ToolController,
		@inject buildTool: BuildTool,
	) {
		super();

		type t = ScreenGui & {
			readonly TextButton: TextButton;
			readonly TaskButton: TextButton;
		};

		print("whate");
		const screen = Interface.getPlayerGui<{ Tutorial: t }>().Tutorial.Clone();
		screen.Enabled = true;
		screen.Parent = Interface.getPlayerGui();
		let tbt = this.asTemplate(screen.TextButton, true);
		const ttbt = tbt;
		tbt = () => {
			const t = ttbt();
			t.Parent = screen;

			return t;
		};

		let tabt = this.asTemplate(screen.TaskButton, true);
		const ttabt = tabt;
		tabt = () => {
			const t = ttabt();
			t.Parent = screen;

			return t;
		};

		class Step extends Component {
			private readonly _isCompleted = OverlayValueStorage.bool();
			readonly isCompleted: ReadonlyObservableValue<boolean> = this._isCompleted;
			private readonly steps: Step[] = [];

			constructor() {
				super();
				this.event.subscribeObservable(this.isCompleted, () => this.update(), true);
			}

			private update() {
				if (this._isCompleted.get()) {
					this.disable();
					return;
				}

				for (const child of this.steps) {
					if (child._isCompleted.get()) {
						child.disable();
						continue;
					}

					child.enable();
					break;
				}
			}

			addRequirements(values: { readonly [k in string]: ReadonlyObservableValue<boolean> }) {
				for (const [k, v] of pairs(values)) {
					this._isCompleted.and(k, v);
				}
			}
			addSteps<T extends { readonly [k in string]: Step }>(values: SingleKey<T>) {
				for (const [k, v] of pairs(values as { readonly [k in string]: Step })) {
					this._isCompleted.and(k, v._isCompleted);
					this.steps.push(v);

					this.parent(v, { enable: false });
					v._isCompleted.subscribe(() => this.update());
				}
			}
			addStep(step: Step, name?: string) {
				name ??= `$step_${this.steps.size()}`;

				this._isCompleted.and(name, step._isCompleted);
				this.steps.push(step);

				this.parent(step, { enable: false });
				step._isCompleted.subscribe(() => this.update());
			}
		}

		const step = <TParent extends Step | undefined>(
			parent: TParent,
			func: (this: Step, parent: TParent) => void,
		) => {
			const step = new Step();
			const f = func as unknown as (selv: Step, parent: TParent) => void;
			f(step, parent);

			parent?.addStep(step);

			return step;
		};

		//

		class TTask extends Component {
			private readonly _isCompleted = OverlayValueStorage.bool();
			readonly isCompleted: ReadonlyObservableValue<boolean> = this._isCompleted;

			addRequirements(values: { readonly [k in string]: ReadonlyObservableValue<boolean> }) {
				for (const [k, v] of pairs(values)) {
					this._isCompleted.and(k, v);
				}
			}

			require(check: (selv: this) => ReadonlyObservableValue<boolean>, falseComponent: () => Component): TTask {
				const checkValue = check(this);
				this.addRequirements({ [tostring(checkValue)]: checkValue });

				const nextTask = new TTask();

				return nextTask;
			}

			checkFrom(func: () => boolean): ReadonlyObservableValue<boolean> {
				const observable = new ObservableValue(false);
				this.event.loop(0, () => observable.set(func()));

				return observable;
			}
		}

		const s = new TTask()
			.require(
				(t) => t.checkFrom(() => toolController.selectedTool.get() === buildTool),
				() => new Control(tbt(), { showOnEnable: true }).setButtonText("open BUILD TOOL"),
			)
			.require(
				(t) => t.checkFrom(() => buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"])),
				() => new Control(tbt(), { showOnEnable: true }).setButtonText("select BLOCKS category"),
			)
			.require(
				(t) => t.checkFrom(() => buildTool.gui.blockSelector.selectedBlock.get()?.id === "block"),
				() => new Control(tbt(), { showOnEnable: true }).setButtonText("select BLOCK block"),
			)
			.require(
				(t) => t.checkFrom(() => plot.getBlockDatas().count((b) => b.id === "block") === 4),
				() => new Control(tbt(), { showOnEnable: true }).setButtonText("build 4 BLOCK blocks"),
			);

		//

		// task.spawn(() => {
		// 	interface rt {}
		// 	class WaitFor extends Component implements rt {
		// 		constructor(condition: () => boolean, start?: () => Component) {
		// 			super();

		// 			this.onEnable(() => {});
		// 		}
		// 	}

		// 	const require = (condition: () => boolean, start?: () => readonly rt[]): rt => {
		// 		let component: Component | undefined;
		// 		while (true as boolean) {
		// 			task.wait();

		// 			if (condition()) {
		// 				break;
		// 			}

		// 			if (component) continue;
		// 			component = start?.();
		// 		}

		// 		component?.destroy();
		// 	};
		// 	const waitFor = (condition: () => boolean, start?: () => Component): rt => {
		// 		let component: Component | undefined;
		// 		while (true as boolean) {
		// 			task.wait();

		// 			if (condition()) {
		// 				break;
		// 			}

		// 			if (component) continue;
		// 			component = start?.();
		// 		}

		// 		component?.destroy();
		// 	};

		// 	require(() => plot.getBlockDatas().count((b) => b.id === "block") === 4, () => [
		// 		require(() => toolController.selectedTool.get() === buildTool, () => [
		// 			require(() => buildTool.gui.blockSelector.selectedBlock.get()?.id === "block", () => [
		// 				require(() =>
		// 					buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"]), () => [
		// 					new Control(tbt(), { showOnEnable: true }).setButtonText("choose BLOCKS category"),
		// 				]),

		// 				new Control(tbt(), { showOnEnable: true }).setButtonText("choose BLOCK block"),
		// 			]),
		// 		]),
		// 	]);
		// });

		//

		const main = step(undefined, function () {
			//
		});

		const pbs = step(main, function () {
			this.parent(new Control(tabt(), { showOnEnable: true }).setButtonText("Hi build 4 Block blocks"));

			const blockPlaced = new ObservableValue(false);
			this.event.loop(0, () => blockPlaced.set(plot.getBlockDatas().count((b) => b.id === "block") === 4));
			this.addRequirements({ blockPlaced });
		});

		const chooseBlock = step(pbs, function (parent) {
			this.parent(new Control(tbt(), { showOnEnable: true }).setButtonText("choose BLOCK block"));

			const blockSelected = new ObservableValue(false);
			parent.event.loop(0, () =>
				blockSelected.set(buildTool.gui.blockSelector.selectedBlock.get()?.id === "block"),
			);

			this.addRequirements({ blockSelected });
		});
		const chooseBlockCategory = step(chooseBlock, function (parent) {
			this.parent(new Control(tbt(), { showOnEnable: true }).setButtonText("choose BLOCKS category"));

			const categorySelected = new ObservableValue(false);
			parent.event.loop(0, () =>
				categorySelected.set(buildTool.gui.blockSelector.selectedCategory.get().sequenceEquals(["Blocks"])),
			);

			this.addRequirements({ categorySelected });
		});
		const chooseBuildTool = step(chooseBlockCategory, function (parent) {
			this.parent(new Control(tbt(), { showOnEnable: true }).setButtonText("open BUILD TOOL"));

			const toolSelected = new ObservableValue(false);
			parent.event.loop(0, () => toolSelected.set(toolController.selectedTool.get() === buildTool));

			this.addRequirements({ toolSelected });
		});

		main.isCompleted.subscribe((value) => print("MAIN", value));
		this.parent(main);
	}
}
