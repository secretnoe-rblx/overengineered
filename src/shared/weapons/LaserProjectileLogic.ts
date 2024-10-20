import { Workspace } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { WeaponProjectile } from "shared/weapons/BaseProjectileLogic";

export class LaserProjectile extends WeaponProjectile {
	static readonly spawn = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
	}>("laser_spawn", "RemoteEvent");

	private laserVisualCopy;
	private damage;
	constructor(startPosition: Vector3, baseVelocity: Vector3, baseDamage: number) {
		super(startPosition, "LASER", WeaponProjectile.LASER_PROJECTILE, baseVelocity.Unit, baseDamage);
		this.laserVisualCopy = this.projectilePart.Clone();
		this.laserVisualCopy.Parent = Workspace;
		this.projectilePart.Transparency = 1;
		this.damage = this.baseDamage;
	}

	onHit(part: BasePart, point: Vector3): void {
		//this.projectilePart.AssemblyLinearVelocity = Vector3.zero;
		//this.projectilePart.Anchored = true;
		//this.projectilePart.CanCollide = false;
		//this.projectilePart.CanTouch = false;
		//this.disable();
		//super.onHit(part, point);
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		const res = Workspace.Shapecast(this.projectilePart, this.baseVelocity.Unit.mul(1023));
		const dist = res ? res.Distance : 512;
		this.laserVisualCopy.Size = new Vector3(dist, this.projectilePart.Size.Y, this.projectilePart.Size.Z);
		this.laserVisualCopy.Position = this.projectilePart
			.GetPivot()
			.LookVector.mul(dist / 2)
			.add(this.startPosition);

		if (res) {
			this.baseDamage = this.damage * dt;
			super.onHit(res.Instance, res.Position);
		}
		super.onTick(dt, percentage, reversePercentage);
	}
}

LaserProjectile.spawn.invoked.Connect((player, { startPosition, baseVelocity, baseDamage }) => {
	print("Laser spawned");
	new LaserProjectile(startPosition, baseVelocity, baseDamage);
});
