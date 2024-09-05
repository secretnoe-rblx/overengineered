import { RunService } from "@rbxts/services";
import { ImpactController } from "shared/block/impact/ImpactController";
import { BlockConfig } from "shared/blockLogic/BlockConfig";
import { BlockLogicRunner } from "shared/blockLogic/BlockLogicRunner";
import { VehicleSeatBlock } from "shared/blocks/blocks/VehicleSeatBlock";
import { ContainerComponent } from "shared/component/ContainerComponent";
import { GameDefinitions } from "shared/data/GameDefinitions";
import { ObservableValue } from "shared/event/ObservableValue";
import type { GenericBlockLogic } from "shared/blockLogic/BlockLogic";
import type { VehicleSeatBlockLogic } from "shared/blocks/blocks/VehicleSeatBlock";

type BlockData = {
	readonly block: PlacedBlockData;
	readonly logic: GenericBlockLogic;
};

@injectable
export class SharedMachine extends ContainerComponent<GenericBlockLogic> {
	readonly occupiedByLocalPlayer = new ObservableValue(true);
	private impactController?: ImpactController;
	protected readonly blocksMap = new Map<BlockUuid, BlockData>();
	protected readonly runner = this.parent(new BlockLogicRunner());

	constructor(
		@inject private readonly blockList: BlockList,
		@inject private readonly di: DIContainer,
	) {
		super();
	}

	/** Add blocks to the machine, initialize it and start */
	init(blocks: readonly PlacedBlockData[]) {
		const di = this.di.beginScope((di) => di.registerSingleton(this));

		for (const block of blocks) {
			const id = block.id;

			if (!this.blockList.blocks[id]) {
				$err(`Unknown block id ${id}`);
				continue;
			}

			const logicctor = this.blockList.blocks[id]?.logic?.ctor;
			if (!logicctor) continue;

			const logic = di.resolveForeignClass(logicctor, [block]);
			this.add(logic);
			this.blocksMap.set(block.uuid, { block, logic });
		}

		this.initialize(blocks);
		this.enable();
	}
	protected initialize(blocks: readonly PlacedBlockData[]) {
		this.initializeSpeedLimiter();
		this.initializeBlockConnections();

		const impact = this.createImpactControllerIfNeeded(blocks);
		if (impact) {
			this.impactController = this.parent(impact);
		}
	}
	protected createImpactControllerIfNeeded(blocks: readonly PlacedBlockData[]): ImpactController | undefined {
		return this.di.resolveForeignClass(ImpactController, [blocks]);
	}

	getImpactController(): ImpactController | undefined {
		return this.impactController;
	}

	initializeSpeedLimiter() {
		const seat = this.getChildren().find((c) => c instanceof VehicleSeatBlock.logic.ctor) as
			| VehicleSeatBlockLogic
			| undefined;
		if (!seat) return;

		this.event.subscribe(RunService.Heartbeat, () => {
			// Angular speed limit
			const currentAngularVelocity = seat.vehicleSeat.AssemblyAngularVelocity;
			seat.vehicleSeat.AssemblyAngularVelocity = new Vector3(
				math.clamp(
					currentAngularVelocity.X,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
				math.clamp(
					currentAngularVelocity.Y,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
				math.clamp(
					currentAngularVelocity.Z,
					-GameDefinitions.MAX_ANGULAR_SPEED,
					GameDefinitions.MAX_ANGULAR_SPEED,
				),
			);

			// Linear speed limit
			const currentLinearVelocity = seat.vehicleSeat.AssemblyLinearVelocity;
			seat.vehicleSeat.AssemblyLinearVelocity = new Vector3(
				math.clamp(
					currentLinearVelocity.X,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
				math.clamp(
					currentLinearVelocity.Y,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
				math.clamp(
					currentLinearVelocity.Z,
					-GameDefinitions.MAX_LINEAR_SPEED,
					GameDefinitions.MAX_LINEAR_SPEED,
				),
			);
		});
	}

	protected initializeBlockConnections() {
		const logicMap = this.blocksMap.mapToMap((k, v) => $tuple(k, v.logic));

		for (const [, { block, logic }] of this.blocksMap) {
			const def = this.blockList.blocks[block.id]?.logic?.definition;
			if (!def) continue; // should we just continue or throw because this is strange?

			const config = BlockConfig.addDefaults(block.config, def.input);
			logic.initializeInputs(config, logicMap);
		}

		for (const [, { block, logic }] of this.blocksMap) {
			this.runner.add(logic);
		}

		this.runner.startTicking();
	}
}
