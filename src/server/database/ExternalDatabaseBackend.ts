import { HttpService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";
import { JSON } from "engine/shared/fixes/Json";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";

const endpoint = "literal:REDACTED_DOMAIN";
const headers = { Authorization: `Bearer ${Secrets.getSecret("api_token")}` };

type SlotKeys = [ownerId: number, slotId: number];
export class ExternalDatabaseBackendSlots implements DatabaseBackend<SlotKeys> {
	GetAsync([ownerId, slotId]: SlotKeys): string | undefined {
		const url = `${endpoint}/slot?ownerId=${ownerId}&slotIds=${slotId}`;
		$debug("Fetching", url);

		const data = HttpService.GetAsync(url, true, headers);
		return JSON.serialize((JSON.deserialize(data) as { value: object }[])[0].value);
	}
	SetAsync(value: string | undefined, [ownerId, slotId]: SlotKeys): void {
		// this.dataStore.SetAsync(key, value);
	}
	RemoveAsync([ownerId, slotId]: SlotKeys): void {
		// this.dataStore.RemoveAsync(key);
	}
}

type PlayerKeys = [id: number];
export class ExternalDatabaseBackendPlayers implements DatabaseBackend<PlayerKeys> {
	GetAsync([id]: PlayerKeys): string | undefined {
		const url = `${endpoint}/player?id=${id}`;
		$debug("Fetching", url);

		const data = HttpService.GetAsync(url, true, headers);
		return JSON.serialize((JSON.deserialize(data) as { value: object }).value);
	}
	SetAsync(value: string | undefined, [id]: PlayerKeys): void {
		// this.dataStore.SetAsync(key, value);
	}
	RemoveAsync([id]: PlayerKeys): void {
		// this.dataStore.RemoveAsync(key);
	}
}
