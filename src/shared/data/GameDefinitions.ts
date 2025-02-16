import { Players, RunService } from "@rbxts/services";
import { RobloxUnit } from "engine/shared/RobloxUnit";
import { Throttler } from "engine/shared/Throttler";

export namespace GameDefinitions {
	export const GROUP = 1088368;
	export const DEVELOPERS = ["i3ymm", "3QAXM", "samlovebutter", "mgcode_ru", "grgrwerfwe", "hyprlandd"];

	// Building
	export const FREE_SLOTS = 30;
	export const ADMIN_SLOTS = 65 - FREE_SLOTS;

	export const MAX_LINEAR_SPEED = RobloxUnit.Meters_To_Studs(1000);
	export const MAX_ANGULAR_SPEED = 40;
	export const HEIGHT_OFFSET = -16384;

	export function isAdmin(player: Player): boolean {
		if (RunService.IsStudio()) return true;
		if (DEVELOPERS.includes(player.Name)) return true;

		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.GetRankInGroup(GROUP) > 250);

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function isRobloxEngineer(player: Player) {
		const req = Throttler.retryOnFail<boolean>(3, 1, () => player.IsInGroup(1200769));

		if (!req.success) {
			warn(req.error_message);
		}

		return req.success ? req.message : false;
	}

	export function getMaxSlots(player: Player, additional: number) {
		let max = FREE_SLOTS + additional;
		if (isAdmin(player)) max += ADMIN_SLOTS;

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
