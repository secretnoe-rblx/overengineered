import { FloatingWindow } from "client/gui/FloatingWindow";
import { GridEditorControl } from "client/gui/GridEditor";
import { Interface } from "client/gui/Interface";
import { ButtonControl } from "engine/client/gui/Button";
import { Component } from "engine/shared/component/Component";
import { ObjectOverlayStorage } from "engine/shared/component/ObjectOverlayStorage";
import { Transforms } from "engine/shared/component/Transforms";
import type { FloatingWindowDefinition } from "client/gui/FloatingWindow";
import type { GridEditorControlDefinition } from "client/gui/GridEditor";
import type { MainScreenLayout } from "client/gui/MainScreenLayout";
import type { EditMode } from "client/modes/build/BuildingMode";
import type { ObservableValue } from "engine/shared/event/ObservableValue";

@injectable
export class GridController extends Component {
	constructor(
		moveGrid: ObservableValue<number>,
		rotateGrid: ObservableValue<number>,
		editMode: ObservableValue<EditMode>,
		@inject mainScreen: MainScreenLayout,
	) {
		super();

		const gridButton = this.parent(mainScreen.registerTopRightButton("Grid"));
		this.parent(
			new ButtonControl(
				gridButton.instance,
				() => (controlOverlay.get(-1).Visible = !controlOverlay.get(-1).Visible),
			),
		);

		const floatingGui = Interface.getInterface<{
			Floating: { Grid: FloatingWindowDefinition & { Content: GridEditorControlDefinition } };
		}>().Floating.Grid;

		const floatingScreen = this.parent(FloatingWindow.create(floatingGui));
		floatingScreen.add(new GridEditorControl(floatingGui.Content, moveGrid, rotateGrid, editMode));

		const controlOverlay = ObjectOverlayStorage.transform(
			floatingGui,
			{ Visible: false },
			Transforms.commonProps.quadOut02,
		);
	}
}
