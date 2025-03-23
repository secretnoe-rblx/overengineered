import { Workspace } from "@rbxts/services";
import { A2SRemoteEvent } from "engine/shared/event/PERemoteEvent";
import { WeaponProjectile } from "shared/weaponProjectiles/BaseProjectileLogic";
import type { baseWeaponProjectile, projectileModifier } from "shared/weaponProjectiles/BaseProjectileLogic";

type laserVisualsAmountConstant = 1 | 2 | 3 | 4 | 5;
type laser = baseWeaponProjectile & Record<`LaserProjectileVisual${laserVisualsAmountConstant}`, BasePart>;

export class LaserProjectile extends WeaponProjectile {
	static readonly spawn = new A2SRemoteEvent<{
		readonly originPart: BasePart;
		readonly baseDamage: number;
		readonly modifier: projectileModifier;
	}>("laser_spawn", "RemoteEvent");

	private detectionlessSize = new Vector3(1024, this.projectilePart.Size.Y, this.projectilePart.Size.Z);
	private laserModel: BasePart[] = [];
	private damage;

	constructor(
		private originPart: BasePart,
		baseDamage: number,
		modifier: projectileModifier,
	) {
		super(
			originPart.CFrame.Position,
			"ENERGY",
			WeaponProjectile.LASER_PROJECTILE,
			originPart.Rotation,
			baseDamage,
			modifier,
		);
		this.projectilePart.Transparency = 1;
		this.projectilePart.Size = Vector3.one;
		this.damage = this.baseDamage;
		const p = this.originalProjectileModel as laser;
		for (let i = 1; i <= 5; i++) {
			this.laserModel.push(p[`LaserProjectileVisual${i as laserVisualsAmountConstant}`]);
		}
	}

	onTick(dt: number, percentage: number, reversePercentage: number): void {
		const pivo = this.originPart.GetPivot();
		const forwardVector = pivo.XVector.mul(-1);
		this.startPosition = pivo.Position;
		this.projectilePart.PivotTo(pivo);

		let res;
		let iter = 0;
		const length = this.laserModel.size();
		for (iter = 0; iter < length; iter++) {
			const posOffset = 1024 * iter;
			res = Workspace.Shapecast(this.projectilePart, forwardVector.mul(1023));
			this.laserModel[iter].Transparency = 0;
			this.laserModel[iter].PivotTo(this.projectilePart.CFrame);
			if (res === undefined) {
				this.laserModel[iter].Size = this.detectionlessSize;
				this.laserModel[iter].Position = forwardVector.mul(512 + posOffset).add(this.startPosition);
				continue;
			}

			this.laserModel[iter].Size = new Vector3(
				res.Distance,
				this.projectilePart.Size.Y,
				this.projectilePart.Size.Z,
			);
			this.laserModel[iter].Position = forwardVector.mul(res.Distance / 2 + posOffset).add(this.startPosition);
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

LaserProjectile.spawn.invoked.Connect((player, { originPart, baseDamage, modifier }) => {
	print("Laser spawned");
	new LaserProjectile(originPart, baseDamage, modifier);
});
