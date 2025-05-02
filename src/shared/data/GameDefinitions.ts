import { Players, RunService } from "@rbxts/services";
import { PlayerRank } from "engine/shared/PlayerRank";

export namespace GameDefinitions {
	// Building
	export const FREE_SLOTS = 70;
	export const ADMIN_SLOTS = 100 - FREE_SLOTS;

	export const MAX_ANGULAR_SPEED = 40;
	export const HEIGHT_OFFSET = -16384;

	export function getMaxSlots(player: Player, additional: number) {
		let max = FREE_SLOTS + additional;
		if (PlayerRank.isAdmin(player)) max += ADMIN_SLOTS;

		return max;
	}

	export function getEnvironmentInfo(): readonly string[] {
		const ret = [];

		ret.push(`User: ${Players.LocalPlayer.UserId} @${Players.LocalPlayer.Name} ${Players.LocalPlayer.DisplayName}`);
		ret.push(`Build: ${RunService.IsStudio() ? "🔒 Studio" : game.PlaceVersion}`);
		ret.push(`Server: ${RunService.IsStudio() ? "🔒 Studio" : game.JobId}`);

		return ret;
	}
}
