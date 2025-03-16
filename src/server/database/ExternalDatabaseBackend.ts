import { HttpService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";
import { JSON } from "engine/shared/fixes/Json";
import { Strings } from "engine/shared/fixes/String.propmacro";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";
import type { PlayerDatabaseData } from "server/database/PlayerDatabase";
import type { BlocksSerializer } from "shared/building/BlocksSerializer";

const endpoint = "literal:REDACTED_DOMAIN";
const headers = { Authorization: `Bearer ${Secrets.getSecret("api_token")}` };
const headersWithContentType = { ...headers, "Content-Type": "application/json" };

type SlotKeys = [ownerId: number, slotId: number];
export class ExternalDatabaseBackendSlots implements DatabaseBackend<BlocksSerializer.JsonSerializedBlocks, SlotKeys> {
	GetAsync([ownerId, slotId]: SlotKeys): BlocksSerializer.JsonSerializedBlocks | undefined {
		const url = `${endpoint}/slot?ownerId=${ownerId}&slotIds=${slotId}`;
		$log("Fetching", url);

		const result = HttpService.RequestAsync({ Method: "GET", Url: url, Headers: headers });
		if (result.StatusCode === 404) {
			return undefined;
		}
		if (result.StatusCode !== 200) {
			throw `Got HTTP ${result.StatusCode}`;
		}

		return (JSON.deserialize(result.Body) as { value: BlocksSerializer.JsonSerializedBlocks }[])[0].value;
	}
	SetAsync(value: BlocksSerializer.JsonSerializedBlocks, [ownerId, slotId]: SlotKeys): void {
		const url = `${endpoint}/slot?ownerId=${ownerId}&slotIds=${slotId}`;
		const data = JSON.serialize({ slotId, ownerId, value });
		$log("Posting", url);

		const response = HttpService.PostAsync(url, data, "ApplicationJson", false, headers);
		if (!(JSON.deserialize(response) as { success?: boolean }).success) {
			throw `Error while saving slot data: ${Strings.pretty(response)}`;
		}
	}
	RemoveAsync([ownerId, slotId]: SlotKeys): void {
		const url = `${endpoint}/slot`;
		const data = JSON.serialize({ ownerId, slotId });
		$log("Deleting", url, data);

		const response = HttpService.RequestAsync({
			Method: "DELETE",
			Url: url,
			Body: data,
			Headers: headersWithContentType,
		});
		if (!(JSON.deserialize(response.Body) as { success?: boolean }).success) {
			throw `Error while saving slot data: ${Strings.pretty(response)}`;
		}
	}
}

type PlayerKeys = [id: number];
export class ExternalDatabaseBackendPlayers implements DatabaseBackend<PlayerDatabaseData, PlayerKeys> {
	GetAsync([id]: PlayerKeys): PlayerDatabaseData | undefined {
		const url = `${endpoint}/player?id=${id}`;
		$log("Fetching", url);

		const result = HttpService.RequestAsync({ Method: "GET", Url: url, Headers: headers });
		if (result.StatusCode === 404) {
			return undefined;
		}
		if (result.StatusCode !== 200) {
			throw `Got HTTP ${result.StatusCode}`;
		}

		return (JSON.deserialize(result.Body) as { value: PlayerDatabaseData }).value;
	}
	SetAsync(value: PlayerDatabaseData, [id]: PlayerKeys): void {
		const url = `${endpoint}/player?id=${id}`;
		const data = JSON.serialize({ id, value });
		$log("Posting", url);

		const response = HttpService.PostAsync(url, data, "ApplicationJson", false, headers);
		if (!(JSON.deserialize(response) as { success?: boolean }).success) {
			throw `Error while saving player data: ${Strings.pretty(response)}`;
		}
	}
	RemoveAsync([id]: PlayerKeys): void {
		const url = `${endpoint}/player`;
		const data = JSON.serialize({ id });
		$log("Deleting", url, data);

		const response = HttpService.RequestAsync({
			Method: "DELETE",
			Url: url,
			Body: data,
			Headers: headersWithContentType,
		});
		if (!(JSON.deserialize(response.Body) as { success?: boolean }).success) {
			throw `Error while saving player data: ${Strings.pretty(response)}`;
		}
	}
}
