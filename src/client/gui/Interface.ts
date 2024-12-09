import { Players } from "@rbxts/services";

/** @deprecated Use {@link Interfacec} instead */
export namespace Interface {
	/** Receives GameUI from the PlayerGui */
	export function getGameUI<T = ScreenGui>() {
		return getPlayerGui().WaitForChild("GameUI") as T;
	}

	/** Receives Interface from the PlayerGui */
	export function getInterface<T = ScreenGui>() {
		return getPlayerGui().WaitForChild("Interface") as T;
	}

	/** Receives Unscaled from the PlayerGui */
	export function getUnscaledGameUI<T = ScreenGui>() {
		return getPlayerGui().WaitForChild("Unscaled") as T;
	}

	/** Receives PlayerGui.GameUI.Templates */
	export function getTemplates<T>() {
		return getGameUI<{ Templates: T }>().Templates;
	}

	/** Receives Popups from the PlayerGui */
	export function getPopupUI<T extends ScreenGui>() {
		return getPlayerGui().WaitForChild("Popups") as T;
	}

	/** Receives PlayerGui from the client */
	export function getPlayerGui<T = PlayerGui>() {
		return Players.LocalPlayer.WaitForChild("PlayerGui") as T;
	}

	export function isCursorOnVisibleGui(): boolean {
		const playerGUI = getPlayerGui();
		const gameUI = getGameUI();
		const mouse = Players.LocalPlayer.GetMouse();
		const objects = playerGUI.GetGuiObjectsAtPosition(mouse.X, mouse.Y);
		if (
			objects.some(
				(value) =>
					value.Visible === true &&
					value.BackgroundTransparency < 1 &&
					value.IsDescendantOf(gameUI as unknown as Instance),
			)
		) {
			return true;
		}
		return false;
	}
}

export class Interfacec {
	/** Receives GameUI from the PlayerGui */
	getGameUI<T = ScreenGui>() {
		return this.getPlayerGui().WaitForChild("GameUI") as T;
	}

	/** Receives Interface from the PlayerGui */
	getInterface<T = ScreenGui>() {
		return this.getPlayerGui().WaitForChild("Interface") as T;
	}

	/** Receives Unscaled from the PlayerGui */
	getUnscaledGameUI<T = ScreenGui>() {
		return this.getPlayerGui().WaitForChild("Unscaled") as T;
	}

	/** Receives PlayerGui.GameUI.Templates */
	getTemplates<T>() {
		return this.getGameUI<{ Templates: T }>().Templates;
	}

	/** Receives Popups from the PlayerGui */
	getPopupUI<T extends ScreenGui>() {
		return this.getPlayerGui().WaitForChild("Popups") as T;
	}

	private playerGui?: Instance;
	/** Receives PlayerGui from the client */
	getPlayerGui<T = PlayerGui>() {
		return (this.playerGui ??= Players.LocalPlayer.WaitForChild("PlayerGui")) as T;
	}

	isCursorOnVisibleGui(): boolean {
		const playerGUI = this.getPlayerGui();
		const gameUI = this.getGameUI();
		const mouse = Players.LocalPlayer.GetMouse();
		const objects = playerGUI.GetGuiObjectsAtPosition(mouse.X, mouse.Y);
		if (
			objects.some(
				(value) =>
					value.Visible === true &&
					value.BackgroundTransparency < 1 &&
					value.IsDescendantOf(gameUI as unknown as Instance),
			)
		) {
			return true;
		}
		return false;
	}
}
