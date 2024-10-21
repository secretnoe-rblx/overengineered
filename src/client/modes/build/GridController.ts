import { ButtonControl } from "client/gui/controls/Button";
import { FloatingWindow } from "client/gui/FloatingWindow";
import { GridEditorControl } from "client/gui/GridEditor";
import { Interface } from "client/gui/Interface";
import { Component } from "engine/shared/component/Component";
import { ObjectOverlayStorage } from "engine/shared/component/ObjectOverlayStorage";
import { Transforms } from "engine/shared/component/Transforms";
import type { FloatingWindowDefinition } from "client/gui/FloatingWindow";
import type { GridEditorControlDefinition } from "client/gui/GridEditor";
import type { Topbar } from "client/gui/Topbar";
import type { EditMode } from "client/modes/build/BuildingMode";
import type { EditTool } from "client/tools/EditTool";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

@injectable
export class GridController extends Component {
	constructor(
		moveGrid: ObservableValue<number>,
		rotateGrid: ObservableValue<number>,
		editMode: ObservableValue<EditMode>,
		@inject editTool: EditTool,
		@inject topbar: Topbar,
	) {
		super();

		const gui = Interface.getInterface<{
			Floating: { Grid: FloatingWindowDefinition & { Content: GridEditorControlDefinition } };
		}>().Floating.Grid;

		const floatingScreen = this.parent(FloatingWindow.create(gui));
		floatingScreen.add(new GridEditorControl(gui.Content, moveGrid, rotateGrid, editMode));

		const controlOverlay = ObjectOverlayStorage.transform(
			gui,
			{ Visible: false },
			Transforms.commonProps.quadOut02,
		);

		this.event.subscribeObservable(
			editTool.selectedMode,
			(mode) => (controlOverlay.get(0).Visible = mode === undefined ? false : undefined),
			true,
		);
		this.parent(
			new ButtonControl(
				topbar.getRightButtonsGui<GuiButton>("Grid"),
				() => (controlOverlay.get(-1).Visible = controlOverlay.get(-1).Visible ? undefined : true),
			),
		);
	}
}
