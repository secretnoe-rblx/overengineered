import { A2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { WeaponProjectile } from "shared/weapons/BaseProjectileLogic";
import type { projectileModifier } from "shared/weapons/BaseProjectileLogic";

export class BulletProjectile extends WeaponProjectile {
	static readonly spawn = new A2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
		readonly modifier: projectileModifier;
	}>("bullet_spawn", "RemoteEvent");

	constructor(startPosition: Vector3, baseVelocity: Vector3, baseDamage: number, modifier: projectileModifier) {
		super(startPosition, "KINETIC", WeaponProjectile.BULLET_PROJECTILE, baseVelocity, baseDamage, modifier);
	}

	onHit(part: BasePart, point: Vector3): void {
		const startedWithSize = this.projectilePart.Size;
		this.projectilePart.AssemblyLinearVelocity = Vector3.zero;
		this.projectilePart.Anchored = true;
		this.projectilePart.CanCollide = false;
		this.projectilePart.CanTouch = false;
		this.disable();
		this.projectilePart.Position = this.projectilePart.CFrame.PointToWorldSpace(
			new Vector3(0, startedWithSize.Y / 2, 0),
		);

		super.onHit(part, point, true);
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		super.onTick(dt, percentage, reversePercentage);
	}
}
BulletProjectile.spawn.invoked.Connect((player, { startPosition, baseVelocity, baseDamage, modifier }) => {
	print("Bullet spawned");
	new BulletProjectile(startPosition, baseVelocity, baseDamage, modifier);
});
