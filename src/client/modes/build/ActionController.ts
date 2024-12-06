import { LoadingController } from "client/controller/LoadingController";
import { LogControl } from "client/gui/static/LogControl";
import { Action } from "engine/client/Action";
import { InputController } from "engine/client/InputController";
import { Component } from "engine/shared/component/Component";
import { ObservableCollectionArr } from "engine/shared/event/ObservableCollection";
import { Signal } from "engine/shared/event/Signal";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";

interface Operation {
	readonly description: string;
	readonly undo: () => void | Response;
	readonly redo: () => void | Response;
}

@injectable
export class ActionController extends Component {
	/** @deprecated Use `@inject` instead */
	static instance: ActionController;

	readonly undoAction = this.parent(new Action(() => this.undo()));
	readonly redoAction = this.parent(new Action(() => this.redo()));

	readonly onUndo = new Signal<(operation: Operation) => void>();
	readonly onRedo = new Signal<(operation: Operation) => void>();
	private readonly history = new ObservableCollectionArr<Operation>();
	private readonly redoHistory = new ObservableCollectionArr<Operation>();

	constructor(@inject mainScreen: MainScreenLayout) {
		super();

		if (ActionController.instance) throw "what";
		ActionController.instance = this;

		this.undoAction.subCanExecuteFrom({
			isntLoading: LoadingController.isNotLoading,
			historyNotEmpty: this.history.createBased((ops) => ops.size() !== 0),
		});
		this.redoAction.subCanExecuteFrom({
			isntLoading: LoadingController.isNotLoading,
			historyNotEmpty: this.redoHistory.createBased((ops) => ops.size() !== 0),
		});

		this.parent(mainScreen.registerTopRightButton("Undo")) //
			.subscribeToAction(this.undoAction);
		this.parent(mainScreen.registerTopRightButton("Redo")) //
			.subscribeToAction(this.redoAction);

		this.event.onKeyDown("Z", () => {
			if (!InputController.isCtrlPressed()) return;
			this.undoAction.execute();
		});
		this.event.onKeyDown("Y", () => {
			if (!InputController.isCtrlPressed()) return;
			this.redoAction.execute();
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

	private redo(): void {
		const operation = this.redoHistory.pop();
		if (!operation) return;

		this.history.push(operation);
		const response = operation.redo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error redoing "${operation.description}": ${response.message}`);
			return;
		}

		this.onRedo.Fire(operation);
		LogControl.instance.addLine(`Redone "${operation.description}"`);
	}

	private undo(): void {
		const operation = this.history.pop();
		if (!operation) return;

		this.redoHistory.push(operation);
		const response = operation.undo();
		if (response && !response.success) {
			LogControl.instance.addLine(`Error undoing "${operation.description}": ${response.message}`);
			return;
		}

		this.onUndo.Fire(operation);
		LogControl.instance.addLine(`Undone "${operation.description}"`);
	}
}
