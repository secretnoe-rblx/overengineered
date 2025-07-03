import { HttpService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";

const endpoint = "literal:REDACTED_DOMAIN";
const headers = { Authorization: `Bearer ${Secrets.getSecret("api_token")}` };
const headersWithContentType = { ...headers, "Content-Type": "application/json" };

export namespace ExternalDatabaseBans {
	export function Ban(player: Player, reason: string, duration: number | undefined) {
		const url = `${endpoint}/player/ban/`;

		const data = {
			playerId: player.UserId,
			publicBanReason: reason,
			privateBanReason: reason + " (from the game)",
			duration,
		};

		const result = HttpService.RequestAsync({
			Method: "POST",
			Url: url,
			Headers: headersWithContentType,
			Body: HttpService.JSONEncode(data),
		});
		if (result.StatusCode === 404) {
			return undefined;
		}
		if (result.StatusCode !== 200) {
			throw `Got HTTP ${result.StatusCode}`;
		}

		kickBannedPlayer(player, reason, duration ? DateTime.now().UnixTimestampMillis + duration * 1000 : undefined);
	}

	const secondsToText = (msuntil: number): string => {
		const intervals = [
			{ label: "year", seconds: 31536000 },
			{ label: "month", seconds: 2592000 },
			{ label: "day", seconds: 86400 },
			{ label: "hour", seconds: 3600 },
			{ label: "minute", seconds: 60 },
			{ label: "second", seconds: 1 },
		];

		const seconds = (msuntil - DateTime.now().UnixTimestampMillis) / 1000;
		for (const interval of intervals) {
			const count = math.floor(seconds / interval.seconds);
			if (count >= 1) {
				return `${count} ${interval.label}${count !== 1 ? "s" : ""} left`;
			}
		}

		return "ඞ";
	};

	export function kickBannedPlayer(player: Player, reason: string, time: number | undefined) {
		player.Kick(
			`You are ${time ? "temporarily" : "permanently"} banned!\nReason:${reason}${time && `\n${secondsToText(time)}`}\n\nAppeals: https://discord.gg/raax9xUMDc`,
		);
	}
}
