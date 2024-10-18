import { Workspace } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { WeaponProjectile } from "shared/weapons/BaseProjectileLogic";

export class LaserProjectile extends WeaponProjectile {
	static readonly spawn = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
	}>("laser_spawn", "RemoteEvent");

	constructor(startPosition: Vector3, baseVelocity: Vector3, baseDamage: number) {
		super(startPosition, "LASER", WeaponProjectile.LASER_PROJECTILE, baseVelocity.Unit, baseDamage);
	}

	onHit(part: BasePart, point: Vector3): void {
		//this.projectilePart.AssemblyLinearVelocity = Vector3.zero;
		//this.projectilePart.Anchored = true;
		//this.projectilePart.CanCollide = false;
		//this.projectilePart.CanTouch = false;
		//this.disable();
		super.onHit(part, point);
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		const res = Workspace.Shapecast(this.projectilePart, this.baseVelocity.mul(1000));
		const dist = res ? res.Distance : 512;
		this.projectilePart.Size = new Vector3(dist, this.projectilePart.Size.Y, this.projectilePart.Size.Z);
		//TODO: very important vvvvvvvvvvvvvvvvvv
		//get point between the emitter point and target
		//set position to be the middle point
		print(res?.Distance, this.projectilePart.Size);
		super.onTick(dt, percentage, reversePercentage);
	}
}

LaserProjectile.spawn.invoked.Connect((player, { startPosition, baseVelocity, baseDamage }) => {
	print("Laser spawned");
	new LaserProjectile(startPosition, baseVelocity, baseDamage);
});
