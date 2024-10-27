import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { S2CRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { ExplosionEffect } from "shared/effects/ExplosionEffect";
import { FireEffect } from "shared/effects/FireEffect";
import { ImpactSoundEffect } from "shared/effects/ImpactSoundEffect";
import { ParticleEffect } from "shared/effects/ParticleEffect";
import { SoundEffect } from "shared/effects/SoundEffect";
import { SparksEffect } from "shared/effects/SparksEffect";
import type { GameHostBuilder } from "engine/shared/GameHostBuilder";

export type ClientExplodeArgs = {
	readonly origin: BasePart;
	readonly localParts: BasePart[];
	readonly radius: number;
	readonly pressure: number;
	readonly isFlammable: boolean;
	readonly soundIndex: number;
};

export type ServerExplodeArgs = {
	readonly origin: BasePart;
	readonly radius: number;
	readonly pressure: number;
	readonly isFlammable: boolean;
	readonly soundIndex: number;
};

export namespace RemoteEvents {
	export function initializeVisualEffects(host: GameHostBuilder) {
		host.services.registerSingletonClass(SparksEffect).autoInit();
		host.services.registerSingletonClass(ImpactSoundEffect).autoInit();
		host.services.registerSingletonClass(ExplosionEffect).autoInit();
		host.services.registerSingletonClass(FireEffect).autoInit();
		host.services.registerSingletonClass(SoundEffect).autoInit();
		host.services.registerSingletonClass(ParticleEffect).autoInit();
	}

	export const Burn = new AutoC2SRemoteEvent<BasePart[]>("burn");
	export const ImpactBreak = new AutoC2SRemoteEvent<BasePart[]>("impact_break");

	export const ClientExplode = new AutoC2SRemoteEvent<ClientExplodeArgs>("client_explode");
	export const ServerExplode = new S2CRemoteEvent<ServerExplodeArgs>("server_explode");

	// empty method just to trigger the constructors
	export function initialize() {}
}
