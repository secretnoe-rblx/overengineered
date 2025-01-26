import { Workspace } from "@rbxts/services";
import { AutoC2SRemoteEvent } from "engine/shared/event/C2SRemoteEvent";
import { WeaponProjectile } from "shared/weapons/BaseProjectileLogic";
import type { baseWeaponProjectile, projectileModifier } from "shared/weapons/BaseProjectileLogic";

type laserVisualsAmountConstant = 1 | 2 | 3 | 4 | 5;
type laser = baseWeaponProjectile & Record<`LaserProjectileVisual${laserVisualsAmountConstant}`, BasePart>;

export class LaserProjectile extends WeaponProjectile {
	static readonly spawn = new AutoC2SRemoteEvent<{
		readonly startPosition: Vector3;
		readonly baseVelocity: Vector3;
		readonly baseDamage: number;
		readonly modifier: projectileModifier;
	}>("laser_spawn", "RemoteEvent");

	private forwardVector = this.projectilePart.GetPivot().LookVector;
	private detectionlessSize = new Vector3(1024, this.projectilePart.Size.Y, this.projectilePart.Size.Z);
	private laserModel: BasePart[] = [];
	private damage;

	constructor(startPosition: Vector3, baseVelocity: Vector3, baseDamage: number, modifier: projectileModifier) {
		super(startPosition, "ENERGY", WeaponProjectile.LASER_PROJECTILE, baseVelocity.Unit, baseDamage, modifier);
		this.projectilePart.Transparency = 1;
		this.projectilePart.Size = Vector3.one;
		this.damage = this.baseDamage;
		const p = this.originalProjectileModel as laser;
		for (let i = 1; i <= 5; i++) {
			this.laserModel.push(p[`LaserProjectileVisual${i as laserVisualsAmountConstant}`]);
		}
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		let res;
		let iter = 0;
		const length = this.laserModel.size();
		for (iter = 0; iter < length; iter++) {
			const posOffset = 1024 * iter;
			this.projectilePart.Position = this.forwardVector.mul(posOffset).add(this.startPosition);
			res = Workspace.Shapecast(this.projectilePart, this.baseVelocity.Unit.mul(1023));
			this.laserModel[iter].Transparency = 0;
			this.laserModel[iter].PivotTo(this.projectilePart.GetPivot());
			if (res === undefined) {
				this.laserModel[iter].Size = this.detectionlessSize;
				this.laserModel[iter].Position = this.forwardVector.mul(512 + posOffset).add(this.startPosition);
				continue;
			}

			this.laserModel[iter].Size = new Vector3(
				res.Distance,
				this.projectilePart.Size.Y,
				this.projectilePart.Size.Z,
			);
			this.laserModel[iter].Position = this.forwardVector
				.mul(res.Distance / 2 + posOffset)
				.add(this.startPosition);
			break;
		}
		// скрыть неактивные части
		for (let i = math.min(iter + 1, length - 1); i < length; i++) this.laserModel[i].Transparency = 1;

		//нанести дамаг
		if (res) {
			this.baseDamage = this.damage * dt;
			super.onHit(res.Instance, res.Position);
		}
		super.onTick(dt, percentage, reversePercentage);
	}
}

LaserProjectile.spawn.invoked.Connect((player, { startPosition, baseVelocity, baseDamage, modifier }) => {
	print("Laser spawned");
	new LaserProjectile(startPosition, baseVelocity, baseDamage, modifier);
});
