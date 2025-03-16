import { RunService } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { WeaponProjectile } from "shared/weaponProjectiles/BaseProjectileLogic";
import type { projectileModifier } from "shared/weaponProjectiles/BaseProjectileLogic";

export class ShellProjectile extends WeaponProjectile {
	static readonly spawn = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
		readonly modifier: projectileModifier;
	}>("shell_spawn", "RemoteEvent");

	constructor(startPosition: Vector3, baseVelocity: Vector3, baseDamage: number, modifier: projectileModifier) {
		super(startPosition, "KINETIC", WeaponProjectile.SHELL_PROJECTILE, baseVelocity, baseDamage, modifier);
	}

	onHit(part: BasePart, point: Vector3): void {
		const force = this.projectilePart.AssemblyLinearVelocity.add(this.projectilePart.AssemblyAngularVelocity).mul(
			this.projectilePart.Mass,
		);
		const startedWithSize = this.projectilePart.Size;
		this.projectilePart.AssemblyLinearVelocity = Vector3.zero;
		this.projectilePart.Anchored = true;
		this.projectilePart.CanCollide = false;
		this.projectilePart.CanTouch = false;
		this.disable();
		this.projectilePart.Position = this.projectilePart.CFrame.PointToWorldSpace(
			new Vector3(0, startedWithSize.Y / 2, 0),
		);

		//push impcated part
		//if (!part.Anchored)
		//part.ApplyImpulse(Vector3.xAxis.mul(1000)); //force.mul(100));
		print(part);
		RunService.Heartbeat.Connect(() => part.ApplyImpulse(Vector3.xAxis.mul(100000)));
		super.onHit(part, point, true);
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		super.onTick(dt, percentage, reversePercentage);
	}
}
ShellProjectile.spawn.invoked.Connect((player, { startPosition, baseVelocity, baseDamage, modifier }) => {
	print("Bullet spawned");
	new ShellProjectile(startPosition, baseVelocity, baseDamage, modifier);
});
