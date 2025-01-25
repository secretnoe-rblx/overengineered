import { Workspace } from "@rbxts/services";
import { HostedService } from "engine/shared/di/HostedService";
import { BlockManager } from "shared/building/BlockManager";
import type { SharedPlots } from "shared/building/SharedPlots";
import type { projectileModifier } from "shared/weapons/BaseProjectileLogic";

type weaponMarker = {
	markerInstance: BasePart;
	occupiedWith: {
		module: WeaponModule | undefined;
		block: PlacedBlockData | Block | undefined;
	};
};

type markerName = string;
type uuid = string;
type recalcOut = {
	module: WeaponModule;
	extraModifier?: projectileModifier;
	activeOutputs: {
		marker: weaponMarker;
		output: Vector3;
	}[];
};

export class WeaponModule {
	static readonly allModules: Record<uuid, WeaponModule> = {};
	readonly block: Block;
	readonly instance: BlockModel;

	readonly allMarkers = new Map<markerName, weaponMarker>();

	pregeneratedCollection: ModuleCollection = new ModuleCollection(this);
	parentCollection: ModuleCollection = this.pregeneratedCollection;

	constructor(
		placedBlock: PlacedBlockData,
		private readonly blockList: BlockList,
	) {
		this.block = blockList.blocks[placedBlock.id]!;
		this.instance = placedBlock.instance;

		const fm = (placedBlock.instance.WaitForChild("moduleMarkers")?.GetChildren() ?? []) as BasePart[];
		const configMarkers = new Set();
		for (const [k, v] of pairs(this.block.weaponConfig!.markers)) {
			configMarkers.add(k);
		}

		for (const m of fm) {
			if (!configMarkers.has(m.Name)) throw "Weapon marker not found";
			this.allMarkers.set(m.Name, {
				markerInstance: m,
				occupiedWith: {
					block: undefined,
					module: undefined,
				},
			});
		}

		if (this.block.weaponConfig) WeaponModule.allModules[placedBlock.uuid] = this;
		this.parentCollection.init();
	}

	getModuleMarkers() {
		const res = [];
		for (const [k, v] of pairs(this.allMarkers)) res.push(v);
		return res;
	}

	update() {
		//get all colided marker touches with
		//iterate through the touched parts
		//	if occupiedWithBlock !== undefined
		//	if a block
		//	if the same type
		//	set module
		const foundMarkers = this.allMarkers;
		const configMarkers = this.block.weaponConfig!.markers;
		const params = new OverlapParams();
		params.CollisionGroup = "Blocks";

		const allCollidedCollections: Set<ModuleCollection> = new Set();

		const pivo = this.instance.GetPivot();
		for (const [k, v] of pairs(configMarkers)) {
			const marker = foundMarkers.get(k)!;
			const touching = Workspace.GetPartsInPart(marker.markerInstance, params);

			marker.occupiedWith.block = undefined;
			marker.occupiedWith.module = undefined;

			for (const t of touching) {
				const touchingBlock = BlockManager.getBlockDataByPart(t); //get the first one
				if (!touchingBlock) continue;
				const mod = WeaponModule.allModules[touchingBlock.uuid];
				const config = this.block.weaponConfig!.markers[k];

				//check if the type of the block is the same as the module's
				//if (config.allowedTypes.indexOf(mod.block.weaponConfig!.type) < 0) continue;

				//check if the id of the block is the same as allowed for this module
				if (config.allowedBlockIds.indexOf(mod.block.id) < 0) continue;

				marker.occupiedWith.block = touchingBlock;
				marker.occupiedWith.module = mod;

				if (marker.occupiedWith.module.parentCollection !== this.parentCollection)
					allCollidedCollections.add(marker.occupiedWith.module.parentCollection);

				break;
			}
		}

		this.parentCollection.combineWithModuleCollections(...allCollidedCollections);
	}
}

export class ModuleCollection {
	readonly modules: Set<WeaponModule> = new Set();
	readonly emitters: Set<WeaponModule> = new Set();
	readonly calculatedOutputs: {
		module: WeaponModule;
		outputs: {
			marker: weaponMarker;
			output: Vector3;
		}[];
		modifiers: projectileModifier[];
	}[] = [];

	constructor(readonly mainModule: WeaponModule) {
		this.modules.add(mainModule);
	}

	init() {
		if (this.mainModule.block.weaponConfig!.type === "CORE") this.emitters.add(this.mainModule);
	}

	combineWithModules(...another: WeaponModule[]) {
		const parentCollections = new Set<ModuleCollection>();
		for (const k of another) parentCollections.add(k.parentCollection);

		this.combineWithModuleCollections(...parentCollections);
	}

	combineWithModuleCollections(...collections: ModuleCollection[]) {
		for (const c of collections) {
			if (c === this) continue;
			for (const k of c.modules) {
				k.parentCollection = this;
				this.modules.add(k);
				if (k.block.weaponConfig!.type === "CORE") this.emitters.add(k);
			}
		}
	}

	removeModules(...another: WeaponModule[]) {
		for (const m of another) {
			m.parentCollection = m.pregeneratedCollection;
			this.modules.delete(m);
			this.emitters.delete(m);
		}
	}

	recursivePath(
		outputArray: recalcOut[][],
		nextModule: WeaponModule,
		path: recalcOut[] = [],
	): recalcOut[] | undefined {
		const connectedModules: WeaponModule[] = [];
		const activeOutputs: {
			marker: weaponMarker;
			output: Vector3;
		}[] = [];

		//get all markers
		for (const [n, e] of pairs(nextModule.allMarkers)) {
			if (!e.occupiedWith.block) {
				activeOutputs.push({
					marker: e,
					output: e.markerInstance.Position.sub(nextModule.instance.GetPivot().Position),
				});
			}

			if (e.occupiedWith.module) {
				connectedModules.push(e.occupiedWith.module);
			}
		}

		const obj: recalcOut = {
			module: nextModule,
			activeOutputs,
		};

		// if (el.size() > 0) {
		// 	const baseModifierValue: modifierValue = { value: 1 / activeOutputs.size(), isRelative: true };
		// 	obj.extraModifier = {
		// 		speedModifier: baseModifierValue,
		// 		lifetimeModifier: baseModifierValue,
		// 		heatDamage: baseModifierValue,
		// 		impactDamage: baseModifierValue,
		// 		explosiveDamage: baseModifierValue,
		// 	};
		// }

		//if size === then there's only one block
		// therefore just stop iterations on it
		if (path.size() + connectedModules.size() === 0) {
			outputArray.push([obj]);
			return;
		}

		//just add last module to the path at this point
		path.push(obj);

		//if there are modules attached to the markers
		if (connectedModules.size() === 0) return path;

		for (const e of connectedModules) {
			const p = this.recursivePath(outputArray, e, [...path]);
			if (!p) continue;
			outputArray.push(p);
		}
		return;
	}

	private static calculateTotalModifier(modifiers: projectileModifier[]): projectileModifier {
		const result: projectileModifier = {
			speedModifier: { value: 0 },
			heatDamage: { value: 0 },
			impactDamage: { value: 0 },
			explosiveDamage: { value: 0 },
			lifetimeModifier: { value: 0 },
		};
		for (const m of modifiers) {
			for (const [k, v] of pairs(m)) {
				if (v.isRelative) {
					result[k]!.value *= v.value;
					continue;
				}
				result[k]!.value += v.value;
			}
		}

		return result;
	}

	private static addModifiers(modifiers: projectileModifier[]): projectileModifier {
		const result: projectileModifier = {
			speedModifier: { value: 0 },
			heatDamage: { value: 0 },
			impactDamage: { value: 0 },
			explosiveDamage: { value: 0 },
			lifetimeModifier: { value: 0 },
		};

		for (const m of modifiers) {
			for (const [k, v] of pairs(m)) {
				result[k]!.value += v.value;
			}
		}

		return result;
	}

	recalc() {
		const paths: recalcOut[][] = [];
		for (const e of this.emitters) this.recursivePath(paths, e);
		print(paths.map((v) => v.map((e) => e.module.instance)));
		this.calculatedOutputs.clear();

		const getUpgrades = (a: recalcOut): projectileModifier => {
			const markers = a.module.getModuleMarkers();
			const result = {
				speedModifier: { value: 0 },
				heatDamage: { value: 0 },
				impactDamage: { value: 0 },
				explosiveDamage: { value: 0 },
				lifetimeModifier: { value: 0 },
			};

			//todo: finish <--------------------------------------------------------

			// for(const [name, marker] of pairs(a.module.allMarkers)){
			// 	const mod = marker.occupiedWith.module;
			// 	if(mod && mod.block.weaponConfig?.type === "UPGRADE"){
			// 		const ps:recalcOut[][] = [];
			// 		this.recursivePath(ps, mod);
			// 		const mfs: projectileModifier[] = [];
			// 		for(const p of ps){

			// 			mfs.push(p .module!.block.weaponConfig!.modifier);
			// 		}
			// 	}
			// }

			return {} as projectileModifier;
		};

		for (const path of paths) {
			const buf: projectileModifier[] = [];
			for (const p of path) {
				buf.push(p.module.block.weaponConfig!.modifier);

				if (p.activeOutputs.size() === 0) continue;

				buf.push(p.extraModifier!);
				this.calculatedOutputs.push({
					module: p.module,
					modifiers: buf,
					outputs: p.activeOutputs,
				});
			}
		}

		print(this.calculatedOutputs.map((v) => v.module.instance));

		// print(
		// 	"res:",
		// 	paths.map((v) => v.map((j) => j.activeOutputs.size()).reduce((v, n) => (v += n))),
		// );
	}

	// Осталось
	// 1. починить рекурсию - done
	// 2. преобразовать путь в модификаторы (можно во время рекурсии) -  done
	// 3. заспавнить проджектайл с указанными модификаторами
	// 4. прицепить логику к спавну проджектайла
}

@injectable
export class WeaponModuleSystem extends HostedService {
	constructor(@inject blockList: BlockList, @inject plots: SharedPlots) {
		super();

		function updateAll() {
			for (const [_, m] of pairs(WeaponModule.allModules)) {
				m.update();
				wait();
			}

			//debug
			const arr = new Set<ModuleCollection>();
			for (const [_, m] of pairs(WeaponModule.allModules)) {
				arr.add(m.parentCollection);
			}
			for (const c of arr) c.recalc();
		}

		//todo: find out why "Blocks" folder disappear and re-appear again
		task.delay(1, () => {
			print("iniiiiiiiiiiiiiiiiit <--------------------------------");
			for (const p of plots.plots) {
				const folder = p.instance.FindFirstChild("Blocks");
				if (folder === undefined) continue;

				this.event.subscribe(folder.ChildAdded, (block) => {
					new WeaponModule(BlockManager.getBlockDataByBlockModel(block as BlockModel), blockList);
					updateAll();
				});

				this.event.subscribe(folder.ChildRemoved, (block) => {
					delete WeaponModule.allModules[BlockManager.getBlockDataByBlockModel(block as BlockModel).uuid];
					updateAll();
				});
			}
		});
	}
}
