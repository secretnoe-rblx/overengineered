import { Players } from "@rbxts/services";

/** @deprecated Use engine interface namespace instead */
export namespace Interface {
	export const mouse = Players.LocalPlayer.GetMouse();

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
		const objects = getPlayerGui().GetGuiObjectsAtPosition(mouse.X, mouse.Y);
		return objects.some((value) => value.Visible && value.BackgroundTransparency < 1);
	}
}
