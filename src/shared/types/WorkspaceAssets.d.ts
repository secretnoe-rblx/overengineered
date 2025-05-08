interface Workspace {
	Atmosphere: Model & {
		Surface: BasePart & {
			Crowns: Folder;
			Mesh: SpecialMesh;
		};
	};
}
