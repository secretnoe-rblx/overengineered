import { LoadingController } from "client/controller/LoadingController";
import { ButtonControl } from "engine/client/gui/Button";
import { LogControl } from "client/gui/static/LogControl";
import { ClientComponent } from "engine/client/component/ClientComponent";
import { InputController } from "engine/client/InputController";
import { Component } from "engine/shared/component/Component";
import { ObservableCollectionArr } from "engine/shared/event/ObservableCollection";
import { ObservableSwitch } from "engine/shared/event/ObservableSwitch";
import { Signal } from "engine/shared/event/Signal";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";

@injectable
class ActionControllerGui extends Component {
	constructor(@inject mainScreen: MainScreenLayout, @inject actionController: ActionController) {
		super();

		const undov = mainScreen.registerTopRightButton("Undo");
		const redov = mainScreen.registerTopRightButton("Redo");

		this.parent(new ButtonControl(undov.instance, () => actionController.undo()));
		this.parent(new ButtonControl(redov.instance, () => actionController.redo()));

		this.event.subscribeObservable(actionController.canUndo, (canUndo) => undov.visible.set("main", canUndo), true);
		this.event.subscribeObservable(actionController.canRedo, (canRedo) => redov.visible.set("main", canRedo), true);
	}
}

type Operation = {
	readonly description: string;
	readonly undo: () => void | Response;
	readonly redo: () => void | Response;
};

@injectable
export class ActionController extends ClientComponent {
	/** @deprecated Use @inject instead */
	static instance: ActionController;

	readonly canUndo = new ObservableSwitch();
	readonly canRedo = new ObservableSwitch();

	readonly onUndo = new Signal<(operation: Operation) => void>();
	readonly onRedo = new Signal<(operation: Operation) => void>();
	private readonly history = new ObservableCollectionArr<Operation>();
	private readonly redoHistory = new ObservableCollectionArr<Operation>();

	constructor(@inject di: DIContainer) {
		super();

		this.parent(di.resolveForeignClass(ActionControllerGui));

		if (ActionController.instance) throw "what";
		ActionController.instance = this;

		this.event.subscribeImmediately(this.history.collectionChanged, () =>
			this.canUndo.set("main_history", this.history.size() !== 0),
		);
		this.event.subscribeImmediately(this.redoHistory.collectionChanged, () =>
			this.canRedo.set("main_history", this.redoHistory.size() !== 0),
		);

		this.onEnabledStateChange((enabled) => {
			this.canUndo.set("main_enabled", enabled);
			this.canRedo.set("main_enabled", enabled);
		}, true);
		this.event.subscribeObservable(
			LoadingController.isLoading,
			(loading) => {
				this.canUndo.set("isLoading", !loading);
				this.canRedo.set("isLoading", !loading);
			},
			true,
		);

		this.event.onKeyDown("Z", () => {
			if (!this.canUndo.get()) return;
			if (!InputController.isCtrlPressed()) return;

			this.undo();
		});
		this.event.onKeyDown("Y", () => {
			if (!this.canRedo.get()) return;
			if (!InputController.isCtrlPressed()) return;

			this.redo();
		});
	}

	execute<TResult extends Response>(description: string, undo: () => Response, func: () => TResult): TResult {
		const result = func();
		if (result.success) {
			this.appendOperation({ description, undo, redo: func });
		}

		return result;
	}

	appendRedo(operation: Operation): void {
		this.redoHistory.push(operation);
	}
	appendOperation(operation: Operation): void {
		this.history.push(operation);
		this.redoHistory.clear();
	}

	redo(): boolean {
		if (!this.canRedo.get()) return false;

		const operation = this.redoHistory.pop();
		if (!operation) return false;

		this.history.push(operation);
		const response = operation.redo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error redoing "${operation.description}": ${response.message}`);
			return true;
		}

		this.onRedo.Fire(operation);
		LogControl.instance.addLine(`Redone "${operation.description}"`);
		return true;
	}

	undo(): boolean {
		if (!this.canUndo.get()) return false;

		const operation = this.history.pop();
		if (!operation) return false;

		this.redoHistory.push(operation);
		const response = operation.undo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error undoing "${operation.description}": ${response.message}`);
			return true;
		}

		this.onUndo.Fire(operation);
		LogControl.instance.addLine(`Undone "${operation.description}"`);
		return true;
	}
}
