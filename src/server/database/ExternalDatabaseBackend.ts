import { HttpService } from "@rbxts/services";
import { Secrets } from "engine/server/Secrets";
import { JSON } from "engine/shared/fixes/Json";
import { Strings } from "engine/shared/fixes/String.propmacro";
import type { DatabaseBackend } from "engine/server/backend/DatabaseBackend";
import type { PlayerBanned, PlayerDatabaseData } from "server/database/PlayerDatabase";
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

		const val = (JSON.deserialize(result.Body) as { value: BlocksSerializer.JsonSerializedBlocks | string }[])[0]
			.value;
		if (typeIs(val, "string")) {
			return JSON.deserialize(val);
		}

		return val;
	}
	SetAsync(value: BlocksSerializer.JsonSerializedBlocks, [ownerId, slotId]: SlotKeys): void {
		const maxSize = (1 * 1024 * 1024) / 2; // half a megabyte
		const chunkSize = 512 * 1024;

		const serializedVal = JSON.serialize(value);
		$log(`Saving a slot of ${math.round(serializedVal.size() / 1024)} kb`);

		const reqid = math.random(999999999);

		const url = `${endpoint}/slot?ownerId=${ownerId}&slotIds=${slotId}`;
		if (serializedVal.size() > maxSize) {
			const chunks = math.ceil(serializedVal.size() / chunkSize);

			for (let i = 0; i < chunks; i++) {
				const chunkpos = i * chunkSize;
				const url = `${endpoint}/slot/chunk?ownerId=${ownerId}&slotIds=${slotId}`;
				$log(`Posting slot chunk ${i}`, url);

				const postdata = JSON.serialize({
					slotId,
					ownerId,
					chunk: serializedVal.sub(chunkpos + 1, chunkpos + chunkSize),
					chunkIndex: i,
					totalChunks: chunks,
					requestId: reqid,
				});

				const response = HttpService.PostAsync(url, postdata, "ApplicationJson", false, headers);
				$log(`Posting slot chunk ${i}:`, response);

				if (!(JSON.deserialize(response) as { success?: boolean }).success) {
					throw `Error while saving slot data: ${Strings.pretty(response)}`;
				}
			}

			return;
		}

		const data = JSON.serialize({ slotId, ownerId, value });
		$log(`Posting the slot`, url);
		const response = HttpService.PostAsync(url, data, "ApplicationJson", false, headers);
		$log(`Posting the slot:`, response);
		if (!(JSON.deserialize(response) as { success?: boolean }).success) {
			throw `Error while saving slot data: ${Strings.pretty(response)}`;
		}
	}
	RemoveAsync([ownerId, slotId]: SlotKeys): void {
		const url = `${endpoint}/slot?ownerId=${ownerId}&slotId=${slotId}`;
		$log("Deleting", url);

		const response = HttpService.RequestAsync({
			Method: "DELETE",
			Url: url,
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

		const data = JSON.deserialize(result.Body) as { value: PlayerDatabaseData } | PlayerBanned;
		if (!("value" in data)) {
			if ("errorCode" in data) {
				throw data;
			}

			throw "Received unknown error from the server.";
		}

		return data.value;
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
