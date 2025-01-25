import { RunService, Workspace } from "@rbxts/services";
import { InstanceComponent } from "engine/shared/component/InstanceComponent";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { Instances } from "engine/shared/fixes/Instances";
import { RemoteEvents } from "shared/RemoteEvents";

export type modifierValue = {
	isRelative?: boolean;
	value: number;
};

export type projectileModifier = {
	//<----- modifiers, not absolute units!
	speedModifier?: modifierValue; //<-- velocity modifier
	lifetimeModifier?: modifierValue; //<--- time modifier
	heatDamage?: modifierValue; //<-- chance modifier
	impactDamage?: modifierValue; //<-- damage modifier
	explosiveDamage?: modifierValue; //<-- area modifier
};

export type baseWeaponProjectile = {
	Projectile: BasePart;
} & Model;

const PLASMA_BALL = Instances.assets
	.WaitForChild("WeaponProjectiles")
	.WaitForChild("PlasmaProjectile") as baseWeaponProjectile;
const BULLET = Instances.assets
	.WaitForChild("WeaponProjectiles")
	.WaitForChild("BulletProjectile") as baseWeaponProjectile;
const LASER = Instances.assets
	.WaitForChild("WeaponProjectiles")
	.WaitForChild("LaserProjectile") as baseWeaponProjectile;

const projectileFolder = new Instance("Folder", Workspace);
projectileFolder.Name = "Projectiles";

export type ProjectileType = "KINETIC" | "EXPLOSIVE" | "ENERGY";

export class WeaponProjectile extends InstanceComponent<BasePart> {
	static readonly spawn = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly projectileType: ProjectileType;
		readonly projectilePart: BasePart;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
		readonly lifetime?: number; //<--- seconds
		readonly modifiers?: projectileModifier[]; // <------ calculate it yourself!
	}>("projectile_spawn", "RemoteEvent");

	static readonly sync_hit = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly projectileType: ProjectileType;
		readonly projectilePart: BasePart;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
		readonly lifetime?: number; //<--- seconds
	}>("projectile_sync_hit", "RemoteEvent");

	static readonly sync_position = new AutoC2SRemoteEvent<{
		readonly projectile: WeaponProjectile;
	}>("projectile_sync_position", "RemoteEvent");

	rawModifiers: projectileModifier[] = [];
	totalEffect: projectileModifier = {};
	originalLifetime: number | undefined;
	modifiedLifetime: number | undefined;
	currentLifetime: number = 0;
	modifiedVelocity: Vector3;
	static readonly damagedParts: Map<BasePart, number> = new Map();
	static readonly unweldedParts: Map<BasePart, number> = new Map();
	readonly projectilePart: BasePart;
	readonly originalProjectileModel;
	static readonly PLASMA_PROJECTILE: baseWeaponProjectile = PLASMA_BALL;
	static readonly LASER_PROJECTILE: baseWeaponProjectile = LASER;
	static readonly BULLET_PROJECTILE: baseWeaponProjectile = BULLET;

	constructor(
		public startPosition: Vector3,
		readonly projectileType: ProjectileType,
		originalProjectileModel: baseWeaponProjectile,
		public baseVelocity: Vector3,
		public baseDamage: number,
		lifetime?: number, //<--- seconds
		public color?: Color3,
	) {
		const pmodel: baseWeaponProjectile = originalProjectileModel.Clone();
		const newModel = pmodel.Projectile;
		newModel.Position = startPosition;
		newModel.CanCollide = false;
		newModel.CanTouch = true;
		newModel.Massless = true;
		//newModel.CollisionGroup = "Projectile";
		//newModel.EnableFluidForces = false;
		newModel.AssemblyLinearVelocity = baseVelocity;
		//transform projectile and shit
		//ELONgate the projectile to avoid clipping
		super(newModel);
		this.projectilePart = newModel;
		this.originalLifetime = this.modifiedLifetime = lifetime;
		this.modifiedVelocity = baseVelocity;
		this.projectilePart.PivotTo(CFrame.lookAlong(this.projectilePart.Position, baseVelocity));
		this.originalProjectileModel = pmodel;
		pmodel.Parent = projectileFolder;

		this.event.subscribe(this.projectilePart.Touched, (part) => {
			if (part.CollisionGroup === this.projectilePart.CollisionGroup) return;
			this.onHit(part, this.projectilePart?.Position ?? part.Position);
		});
		this.event.subscribe(RunService.PreSimulation, (dt) => {
			const percentage = this.modifiedLifetime === undefined ? 0 : this.currentLifetime / this.modifiedLifetime;
			const reversePercentage = 1 - percentage;
			if (percentage >= 1) return this.destroy();
			this.onTick(dt, percentage, reversePercentage);
		});

		this.enable();
	}

	readonly checkIfCanBeUnwelded = (damage: number, partHealth: number) => damage > partHealth / 4;
	readonly checkIfCanBeDestroyed = (damage: number, partHealth: number) => damage > partHealth;

	applyDamageToPart(part: BasePart) {
		this.recalculateEffects();

		const magicNumber = 18;
		const partHealth =
			(part.Mass * part.CurrentPhysicalProperties.Elasticity * part.CurrentPhysicalProperties.ElasticityWeight) /
			magicNumber;

		WeaponProjectile.damagedParts.get(part) ?? 0;

		const tryYourLuck = (num: number): boolean => math.random() < num;
		function createExplosion(part: BasePart, diameter: number, force: number, enableEffect?: boolean) {
			//affect blocks in radius/diameter somehow
			//there probably is a mothod

			if (enableEffect ?? false) {
				//do explosion effect
			}
		}

		const explode = (part: BasePart, radius: number) =>
			RemoteEvents.Explode.send({
				part,
				radius,
				pressure: 1,
				isFlammable: false,
			});

		const properties = this.projectilePart.CurrentPhysicalProperties;
		const explosiveDamage = this.totalEffect?.explosiveDamage?.value ?? 0;
		const impactDamage = (this.totalEffect?.impactDamage?.value ?? 0) + this.baseDamage;
		const totalDamage =
			(WeaponProjectile.damagedParts.get(part) ?? 0) + (WeaponProjectile.unweldedParts.get(part) ?? 0);
		const inflictedDamage = totalDamage + impactDamage + explosiveDamage;
		const ignitionChance = //
			//basically density == chance, because density can't be bigger than 100, right? right..?
			// (1 - (density[0.01...100] / 100)) * fireChance
			(1 - properties.Density / 100) * math.clamp(this.totalEffect?.heatDamage?.value ?? 0, 0, 1);

		(!WeaponProjectile.unweldedParts.has(part)
			? WeaponProjectile.damagedParts
			: WeaponProjectile.unweldedParts
		).set(part, inflictedDamage);
		//print(WeaponProjectile.damagedParts.get(part), partHealth);

		if (!WeaponProjectile.damagedParts.has(part))
			part.Destroying.Connect(() => WeaponProjectile.damagedParts.delete(part)); //damage here

		// if can be unwelded then make it fall appart and go into a different category
		if (this.checkIfCanBeUnwelded(WeaponProjectile.damagedParts.get(part) ?? 0, partHealth)) {
			RemoteEvents.ImpactBreak.send([part]); //unweld here
			if (WeaponProjectile.damagedParts.has(part)) {
				WeaponProjectile.unweldedParts.set(part, WeaponProjectile.damagedParts.get(part)!);
				WeaponProjectile.damagedParts.delete(part);
			}
		}

		//print(WeaponProjectile.damagedParts.has(part), WeaponProjectile.unweldedParts.has(part));
		/*
		print(
			WeaponProjectile.damagedParts.get(part) ?? 0,
			WeaponProjectile.unweldedParts.get(part) ?? 0,
			partHealth / 4,
			partHealth,
		);
*/
		// if can be destroyed then destroy ig
		if (
			this.checkIfCanBeDestroyed(
				(WeaponProjectile.damagedParts.get(part) ?? 0) + (WeaponProjectile.unweldedParts.get(part) ?? 0),
				partHealth,
			)
		)
			part.Destroy(); //destroy here
		if ((this.totalEffect.explosiveDamage?.value ?? 0) > 0)
			explode(this.projectilePart, this.totalEffect.explosiveDamage?.value ?? 0); //explode here
		if (tryYourLuck(ignitionChance)) RemoteEvents.Burn.send([part]); //put on fire here
	}

	private recalculateEffects() {
		this.totalEffect = {};

		for (const mod of this.rawModifiers) {
			for (const [name, modifierValue] of pairs(mod)) {
				this.totalEffect[name] ??= { value: 0, isRelative: false };
				const oldValue = this.totalEffect[name]!.value;
				if (modifierValue.isRelative && modifierValue.isRelative !== undefined)
					this.totalEffect[name] = { value: oldValue * (1 + modifierValue.value), isRelative: false };
				else this.totalEffect[name] = { value: oldValue + modifierValue.value, isRelative: false };
			}
		}

		if (this.originalLifetime !== undefined)
			this.modifiedLifetime = this.originalLifetime * (this.totalEffect.lifetimeModifier?.value ?? 1);
	}

	addModifier(...modifiers: projectileModifier[]) {
		for (const mod of modifiers) this.rawModifiers.push(mod);
	}

	onHit(part: BasePart, point: Vector3, destroyOnHit = false): void {
		this.applyDamageToPart(part);
		if (destroyOnHit) this.destroy();
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		if (this.isDestroyed()) return;
		this.currentLifetime += dt;
		/*
		this.projectilePart.CFrame = this.projectilePart.CFrame.add(
			this.modifiedVelocity.mul(new Vector3(dt, dt, dt)),
		);*/
	}
}

/*
	To fire something, you need:
	1. something to load ammo in
	- magazine
	- accumulator (laser, plasma)
	- gas tank (plasma)
	- rocket battery

	2. something to fire loaded
	3. something to modify fired
	
	kinetic: 
		magazine -> some loader (?) -> barrel -> nozzle -> world -> some sparks in the hit spots
		- different calibers?
	rocket:
		???
	
	bomb:
		built by player -> installed into holder -> released on command

	laser:
		acumulator -> emitter -> some lenses -> focal lens nozzle -> world -> light source until stopped firing

	plasma:
		??? -> emitter (?) -> accelerator magnet (?) -> nozzle -> world -> flash of colored light on hit
		- Strength depends on distance traveled from the emitter 
*/
