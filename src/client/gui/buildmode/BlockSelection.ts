import { ContentProvider, GuiService, Players } from "@rbxts/services";
import { BlockPreviewControl } from "client/gui/buildmode/BlockPreviewControl";
import { Colors } from "shared/Colors";
import { Control } from "client/gui/Control";
import { BlockPipetteButton } from "client/gui/controls/BlockPipetteButton";
import { TextButtonControl } from "client/gui/controls/Button";
import { Gui } from "client/gui/Gui";
import { GuiAnimator } from "client/gui/GuiAnimator";
import { ObservableValue } from "shared/event/ObservableValue";
import { Localization } from "shared/Localization";
import type { BlockCategoryPath } from "shared/blocks/Block";

type Category = {
	readonly path: BlockCategoryPath;
	readonly name: string;
	readonly sub: Categories;
};
type Categories = { readonly [k in string]: Category };

namespace Categories {
	type CategoryOnlyBlock = Pick<Block, "category">;

	export function createCategoryTreeFromBlocks(blocks: readonly CategoryOnlyBlock[]): Categories {
		// writable
		type Categories = { [k in string]: Category };
		type Category = {
			readonly path: BlockCategoryPath;
			readonly name: string;
			readonly sub: Categories;
		};

		const treeRoot: Category = {
			name: "_root",
			path: [],
			sub: {},
		};

		for (const { category: path } of blocks) {
			let part = treeRoot;
			const subPath: string[] = [];

			for (const pathPart of path) {
				subPath.push(pathPart);

				part = part.sub[pathPart] ??= {
					name: pathPart,
					path: [...subPath],
					sub: {},
				};
			}
		}

		return treeRoot.sub;
	}

	export function getCategoryByPath(allCategories: Categories, path: BlockCategoryPath): Category | undefined {
		let cat: Category | undefined = undefined;
		for (const part of path) {
			if (!cat) {
				cat = allCategories[part];
				continue;
			}

			cat = cat.sub[part];
			if (!cat) {
				return undefined;
			}
		}

		return cat;
	}

	export function getCategoryDescendands(category: Category): Category[] {
		const get = (category: Category): Category[] => asMap(category.sub).flatmap((k, v) => [v, ...get(v)]);
		return get(category);
	}

	export function getBlocksByCategory<TBlock extends CategoryOnlyBlock>(
		allBlocks: readonly TBlock[],
		path: BlockCategoryPath,
	): TBlock[] {
		const sequenceEquals = <T>(left: readonly T[], right: readonly T[]): boolean => {
			if (left.size() !== right.size()) {
				return false;
			}

			for (let i = 0; i < left.size(); i++) {
				if (left[i] !== right[i]) {
					return false;
				}
			}

			return true;
		};

		const ret: TBlock[] = [];
		for (const block of allBlocks) {
			if (block.category === path) {
				ret.push(block);
			} else if (sequenceEquals(block.category, path)) {
				path = block.category;
				ret.push(block);
			}
		}

		return ret;
	}
	export function getBlocksByCategoryRecursive<TBlock extends CategoryOnlyBlock>(
		allCategories: Categories,
		allBlocks: readonly TBlock[],
		path: BlockCategoryPath,
	): TBlock[] {
		const category = getCategoryByPath(allCategories, path);
		if (!category) return [];

		const all = [category, ...getCategoryDescendands(category)];
		return all.flatmap((c) => getBlocksByCategory(allBlocks, c.path));
	}
}

type CategoryControlDefinition = GuiButton & {
	readonly ViewportFrame: ViewportFrame;
	readonly TextLabel: TextLabel;
};
class CategoryControl extends TextButtonControl<CategoryControlDefinition> {
	constructor(template: CategoryControlDefinition, text: string, blocks: readonly BlockModel[]) {
		super(template);
		this.text.set(text);

		if (blocks.size() !== 0) {
			const preview = this.add(new BlockPreviewControl(template.ViewportFrame));
			let blockIndex = 0;

			const update = () => preview.set(blocks[blockIndex++ % blocks.size()]);
			this.onEnable(update);
			this.event.loop(1, update);
		}
	}
}

type BlockControlDefinition = GuiButton & {
	readonly ViewportFrame: ViewportFrame;
	readonly TextLabel: TextLabel;
};
class BlockControl extends TextButtonControl<BlockControlDefinition> {
	constructor(template: BlockControlDefinition, block: Block) {
		super(template);

		this.text.set(block.displayName);
		this.add(new BlockPreviewControl(template.ViewportFrame, block.model));
	}
}

export type BlockSelectionControlDefinition = GuiObject & {
	readonly SearchTextBox: TextBox;
	readonly NoResultsLabel: TextLabel;
	readonly Content: {
		readonly ScrollingFrame: ScrollingFrame & {
			readonly BackButtonTemplate: CategoryControlDefinition;
			readonly BlockButtonTemplate: BlockControlDefinition;
			readonly CategoryButtonTemplate: CategoryControlDefinition;
		};
	};
	readonly Header: {
		readonly Pipette: GuiButton;
	};
	readonly Breadcrumbs: GuiObject & {
		readonly Content: ScrollingFrame & {
			readonly PathTemplate: TextButton;
		};
	};
};

/** Block chooser control */
@injectable
export class BlockSelectionControl extends Control<BlockSelectionControlDefinition> {
	private readonly backTemplate;
	private readonly blockTemplate;
	private readonly categoryTemplate;
	private readonly breadcrumbTemplate;
	private readonly list;

	private readonly categories: Categories;
	readonly selectedCategory = new ObservableValue<BlockCategoryPath>([]);
	readonly selectedBlock = new ObservableValue<Block | undefined>(undefined);
	readonly highlightedBlocks = new ObservableValue<readonly BlockId[] | undefined>(undefined);

	readonly pipette;
	private readonly breadcrumbs;

	constructor(
		template: BlockSelectionControlDefinition,
		@inject readonly blockList: BlockList,
	) {
		super(template);

		this.categories = Categories.createCategoryTreeFromBlocks(blockList.sorted);

		this.list = this.add(
			new Control<ScrollingFrame, BlockControl | CategoryControl>(this.gui.Content.ScrollingFrame),
		);

		this.breadcrumbs = this.add(new Control<ScrollingFrame, TextButtonControl>(this.gui.Breadcrumbs.Content));
		this.breadcrumbTemplate = this.asTemplate(this.gui.Breadcrumbs.Content.PathTemplate);

		// Prepare templates
		this.backTemplate = this.asTemplate(this.gui.Content.ScrollingFrame.BackButtonTemplate);
		this.blockTemplate = this.asTemplate(this.gui.Content.ScrollingFrame.BlockButtonTemplate);
		this.categoryTemplate = this.asTemplate(this.gui.Content.ScrollingFrame.CategoryButtonTemplate);

		this.event.subscribeObservable(this.selectedCategory, (category) => this.create(category, true), true);

		this.pipette = this.add(
			BlockPipetteButton.forBlockId(this.gui.Header.Pipette, (id) => {
				this.selectedBlock.set(blockList.blocks[id]);
				this.selectedCategory.set(this.selectedBlock.get()!.category);
			}),
		);

		this.event.subscribeObservable(this.highlightedBlocks, () => this.create(this.selectedCategory.get(), false));

		// might be useful
		// const searchText = this.event.observableFromGuiParam(this.gui.SearchTextBox, "Text");
		this.event.subscribe(this.gui.SearchTextBox.GetPropertyChangedSignal("Text"), () => {
			this.selectedCategory.set([]);
			this.selectedBlock.set(undefined);

			this.create([], false);
		});
	}

	private create(selectedCategory: BlockCategoryPath, animated: boolean) {
		const highlightButton = (control: Control) =>
			(Gui.getTemplates<{ Highlight: GuiObject }>().Highlight.Clone().Parent = control.instance);

		let idx = 0;

		const createBackButton = (activated: () => void) => {
			const control = new TextButtonControl(this.backTemplate(), activated);
			this.list.add(control);

			const highlightedBlocks = this.highlightedBlocks.get();
			if (highlightedBlocks) {
				for (const targetBlock of highlightedBlocks) {
					const targetCategory = this.blockList.blocks[targetBlock]?.category;
					if (!targetCategory) continue;

					if (targetCategory.size() < selectedCategory.size()) {
						highlightButton(control);
						break;
					}

					for (let i = 0; i < targetCategory.size(); i++) {
						if (!selectedCategory[i]) break;

						if (selectedCategory[i] !== targetCategory[i]) {
							highlightButton(control);
							break;
						}
					}
				}
			}

			control.instance.LayoutOrder = idx++;
			return control;
		};

		const createCategoryButton = (category: BlockCategoryPath, activated: () => void) => {
			const blocks = Categories.getBlocksByCategoryRecursive(
				this.categories,
				this.blockList.sorted,
				category,
			).sort((l, r) => l.model.Name > r.model.Name);
			const models = blocks.map((b) => b.model);

			task.spawn(() => ContentProvider.PreloadAsync(models));

			const control = new CategoryControl(this.categoryTemplate(), category[category.size() - 1], models);
			control.activated.Connect(activated);
			this.list.add(control);

			const targetBlocks = this.highlightedBlocks.get();
			if (targetBlocks && blocks.any((b) => targetBlocks.includes(b.id))) {
				highlightButton(control);
			}

			control.instance.LayoutOrder = idx++;
			return control;
		};

		const createBlockButton = (block: Block, activated: () => void) => {
			const control = new BlockControl(this.blockTemplate(), block);
			control.activated.Connect(activated);
			this.list.add(control);

			control.instance.LayoutOrder = idx++;
			return control;
		};

		this.list.clear();

		const addSlashBreadcrumb = () => {
			const control = this.breadcrumbs.add(new TextButtonControl(this.breadcrumbTemplate()));
			control.text.set("/");
			control.instance.Interactable = false;
		};

		this.breadcrumbs.clear();
		addSlashBreadcrumb();
		for (let i = 0; i < selectedCategory.size(); i++) {
			const path: BlockCategoryPath = selectedCategory.move(0, i, 0, []);
			const control = this.breadcrumbs.add(
				new TextButtonControl(this.breadcrumbTemplate(), () => this.selectedCategory.set(path)),
			);
			control.text.set(selectedCategory[i]);

			if (i < selectedCategory.size() - 1) {
				addSlashBreadcrumb();
			}
		}
		this.breadcrumbs.instance.CanvasPosition = new Vector2(this.breadcrumbs.instance.AbsoluteCanvasSize.X, 0);

		// Back button
		if (selectedCategory.size() !== 0) {
			createBackButton(() => {
				this.gui.SearchTextBox.Text = "";
				this.selectedCategory.set(selectedCategory.filter((_, i) => i !== selectedCategory.size() - 1));
			});
		}

		// Block buttons
		let prev: BlockControl | CategoryControl | undefined;

		const lowerSearch = this.gui.SearchTextBox.Text.fullLower();
		const blocks =
			this.gui.SearchTextBox.Text === ""
				? Categories.getBlocksByCategory(this.blockList.sorted, this.selectedCategory.get())
				: this.blockList.sorted.filter(
						(block) =>
							block.displayName.fullLower().find(lowerSearch)[0] !== undefined ||
							Localization.translateForPlayer(Players.LocalPlayer, block.displayName)
								.fullLower()
								.find(lowerSearch, undefined, true)[0] !== undefined,
					);

		for (const block of blocks) {
			if (block.hidden) continue;

			const button = createBlockButton(block, () => {
				if (this.gui.SearchTextBox.Text !== "") {
					this.gui.SearchTextBox.Text = "";
					this.selectedCategory.set(block.category);
				}
				this.selectedBlock.set(block);
			});

			if (prev) {
				button.instance.NextSelectionUp = prev.instance;
				prev.instance.NextSelectionDown = button.instance;
			}

			button.event.subscribe(button.activated, () => {
				// Gamepad selection improvements
				GuiService.SelectedObject = undefined;
			});

			button.event.subscribeObservable(
				this.selectedBlock,
				(newblock) => {
					button.instance.BackgroundColor3 = newblock === block ? Colors.accentDark : Colors.staticBackground;

					button.instance.FindFirstChild("Highlight")?.Destroy();
					const targetBlocks = this.highlightedBlocks.get();
					if (targetBlocks && newblock !== block && targetBlocks.includes(block.id)) {
						highlightButton(button);
					}

					// Gamepad selection improvements
					button.instance.SelectionOrder = newblock === block ? 0 : 1;
				},
				true,
				true,
			);

			prev = button;
		}

		if (this.gui.SearchTextBox.Text === "") {
			const sorted = asMap(
				Categories.getCategoryByPath(this.categories, selectedCategory)?.sub ?? this.categories,
			)
				.values()
				.sort((l, r) => l.name < r.name);

			// Category buttons
			for (const category of sorted) {
				createCategoryButton(category.path, () =>
					this.selectedCategory.set([...selectedCategory, category.name]),
				);
			}
		}

		// No results label for searching menu
		this.gui.NoResultsLabel.Visible = this.gui.SearchTextBox.Text !== "" && this.list.getChildren().size() === 0;

		// Gamepad selection improvements
		const isSelected = GuiService.SelectedObject !== undefined;
		GuiService.SelectedObject = isSelected ? this.list.getChildren()[0].instance : undefined;
		this.list.instance.CanvasPosition = Vector2.zero;

		if (animated && this.gui.SearchTextBox.Text === "") {
			GuiAnimator.transition(this.gui.Content.ScrollingFrame, 0.2, "up", 10);
			GuiAnimator.transition(this.gui.NoResultsLabel, 0.2, "down", 10);
		}
	}
}
