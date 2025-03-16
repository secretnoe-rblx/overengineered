type PlotModel = Folder & {
	readonly ___nominal: "plotModel";
	//readonly PrimaryPart: BasePart;
	readonly BuildingArea: BasePart;
};

type PlotBlocks = Folder & {
	Parent: PlotModel | undefined;

	// using a dummy parameter to force use this function instead of the default one
	/** @deprecated TOBEDELETED */
	GetChildren(undef: undefined): readonly BlockModel[];
};

type BlockModel = Model & {
	readonly ___nominal: "blockModel";
};
