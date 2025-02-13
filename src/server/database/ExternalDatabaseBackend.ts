import { HttpService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";
import { JSON } from "engine/shared/fixes/Json";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";
import type { PlayerDatabaseData } from "server/database/PlayerDatabase";
import type { BlocksSerializer } from "shared/building/BlocksSerializer";

const endpoint = "literal:REDACTED_DOMAIN";
const headers = { Authorization: `Bearer ${Secrets.getSecret("api_token")}` };

type SlotKeys = [ownerId: number, slotId: number];
export class ExternalDatabaseBackendSlots implements DatabaseBackend<BlocksSerializer.JsonSerializedBlocks, SlotKeys> {
	GetAsync([ownerId, slotId]: SlotKeys): BlocksSerializer.JsonSerializedBlocks | undefined {
		const url = `${endpoint}/slot?ownerId=${ownerId}&slotIds=${slotId}`;
		$debug("Fetching", url);

		const response = HttpService.GetAsync(url, true, headers);
		return (JSON.deserialize(response) as { value: BlocksSerializer.JsonSerializedBlocks }[])[0].value;
	}
	SetAsync(value: BlocksSerializer.JsonSerializedBlocks | undefined, [ownerId, slotId]: SlotKeys): void {
		const url = `${endpoint}/slot?ownerId=${ownerId}&slotIds=${slotId}`;
		const data = JSON.serialize({ slotId, ownerId, value });
		$debug("Posting", url);

		const response = HttpService.PostAsync(url, data, "ApplicationJson", false, headers);
		if (!(JSON.deserialize(response) as { success?: boolean }).success) {
			throw `Error while saving slot data: ${response}`;
		}
	}
	RemoveAsync([ownerId, slotId]: SlotKeys): void {
		throw "Nobody uses this anyway yet";
	}
}

type PlayerKeys = [id: number];
export class ExternalDatabaseBackendPlayers implements DatabaseBackend<PlayerDatabaseData, PlayerKeys> {
	GetAsync([id]: PlayerKeys): PlayerDatabaseData | undefined {
		const url = `${endpoint}/player?id=${id}`;
		$debug("Fetching", url);

		const response = HttpService.GetAsync(url, true, headers);
		return (JSON.deserialize(response) as { value: PlayerDatabaseData }).value;
	}
	SetAsync(value: PlayerDatabaseData | undefined, [id]: PlayerKeys): void {
		const url = `${endpoint}/player?id=${id}`;
		const data = JSON.serialize({ id, value });
		$debug("Posting", url);

		const response = HttpService.PostAsync(url, data, "ApplicationJson", false, headers);
		if (!(JSON.deserialize(response) as { success?: boolean }).success) {
			throw `Error while saving slot data: ${response}`;
		}
	}
	RemoveAsync([id]: PlayerKeys): void {
		throw "Nobody uses this anyway yet";
	}
}
