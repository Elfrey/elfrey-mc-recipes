import { EMCR_CONST } from './consts.js';
import { OwnershipManager } from './ownership-manager.js'


class BookImporter extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: `${EMCR_CONST.MODULE_ID}-book-importer`,
            title: game.i18n.localize("emcr.dialog.title"),
            template: `modules/${EMCR_CONST.MODULE_ID}/templates/book-selector.hbs`,
            width: 670,
            height: 640,
            closeOnSubmit: false,
            resizable: true,
            tabs: [{navSelector: ".emcr-tabs", contentSelector: ".emcr-content", initial: "all"}]
        });
    }

    constructor(options = {}) {
        super(options);
        this.books = [];
    }

    async _enrichComponents(things) {
        const result = [];
        for (const thing of things) {
            const enriched = { ...thing };
            enriched.components = [];
            for (const comp of (thing.components || [])) {
                const item = await fromUuid(comp.uuid).catch(() => null);
                enriched.components.push({
                    ...comp,
                    img: comp.img || (item ? item.img : "icons/commodities/materials/powder-grey.webp"),
                    tags: comp.tags || [],
                    resourcePath: comp.resourcePath || "",
                });
            }
            result.push(enriched);
        }
        return result;
    }

    _onManageOwnership(event) {
        event.preventDefault();
        new OwnershipManager().render(true);
    }

    async getData(options = {}) {
        if (this.books.length === 0) {
            await this.loadBooks();
        }

        return {
            books: this.books,
            uniqueCategories: (books) => {
                return [...new Set(books.map(b => b.category))].sort();
            },
            eq: (a, b) => a === b
        };
    }

    async loadBooks() {
        try {
            const pack = game.packs.get('elfrey-mc-recipes.emcr-books');
            const journals = await pack.getDocuments();

            this.books = [];

            for (const journal of journals) {
                for (const page of journal.pages) {
                    const bookData = page.flags[EMCR_CONST.MODULE_ID]?.book;
                    if (bookData) {
                        this.books.push({
                            ...bookData,
                            category: journal.name,
                            enabled: false
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error loading recipe books:', error);
            ui.notifications.error('Failed to load recipe books');
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Tab handling
        html.find('.emcr-tab-item').click(ev => {
            html.find('.emcr-tab-item').removeClass('active');
            html.find('.emcr-tab-content').removeClass('active');

            const tab = ev.currentTarget.dataset.tab;
            ev.currentTarget.classList.add('active');
            html.find(`.emcr-tab-content[data-tab="${tab}"]`).addClass('active');
        });

        html.find('.emcr-book-checkbox').on('change', this._onToggleBook.bind(this));
        html.find('#emcr-import-button').click(this._onImport.bind(this));
        html.find('#emcr-manage-ownership').click(this._onManageOwnership.bind(this));
    }

    _onToggleBook(event) {
        const checkbox = event.currentTarget;
        const bookName = checkbox.dataset.bookId;
        const book = this.books.find(b => b.name === bookName);
        if (book) {
            book.enabled = checkbox.checked;
        }
    }

    async _onImport(event) {
        event.preventDefault();
        const selectedBooks = this.books.filter(book => book.enabled);

        if (selectedBooks.length === 0) {
            ui.notifications.warn(game.i18n.localize("emcr.notifications.selectBooks"));
            return;
        }

        try {
            // Find or create the Mastercrafted folder
            const folderId = game.folders.find(f =>
                f.type === "JournalEntry" && f.flags?.mastercrafted?.mainMastercraftedFolder
            )?.id ?? (await Folder.create({
                name: "Mastercrafted",
                sorting: "a",
                type: "JournalEntry",
                flags: { mastercrafted: { mainMastercraftedFolder: true } },
            })).id;

            for (const book of selectedBooks) {
                const { category, enabled, documentName, path, id, ...bookData } = book;

                const pages = [];
                for (const recipe of (bookData.recipes || [])) {
                    const ingredients = await this._enrichComponents(recipe.ingredients || []);
                    const products = await this._enrichComponents(recipe.products || []);
                    pages.push({
                        name: recipe.name,
                        type: "mastercrafted.mastercrafted",
                        text: {
                            content: recipe.description ? `<p>${recipe.description}</p>` : `<p></p>`,
                            format: 1
                        },
                        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.INHERIT },
                        flags: {
                            mastercrafted: {
                                img: recipe.img || "",
                                ingredients,
                                ingredientsInspection: recipe.ingredientsInspection || false,
                                macroName: recipe.macroName || "",
                                products,
                                productInspection: recipe.productInspection || false,
                                sound: recipe.sound || "",
                                time: recipe.time || null,
                                require: recipe.tools || recipe.require || "",
                                toolDc: null,
                                toolCheck: null,
                                abilityCheck: null,
                                abilityDc: null,
                                expression: "",
                                modifierList: [],
                            }
                        }
                    });
                }

                const bookFlags = {
                    mastercrafted: {
                        description: bookData.description || "",
                        img: bookData.img || "",
                        ingredientsInspection: bookData.ingredientsInspection,
                        productInspection: bookData.productInspection,
                        sound: bookData.sound || "",
                        require: bookData.tools || bookData.require || "",
                    }
                };

                const existingJournal = game.journal.getName(bookData.name);

                if (existingJournal) {
                    await existingJournal.update({ flags: bookFlags });
                    const pageIds = existingJournal.pages.map(p => p.id);
                    if (pageIds.length) await existingJournal.deleteEmbeddedDocuments("JournalEntryPage", pageIds);
                    await existingJournal.createEmbeddedDocuments("JournalEntryPage", pages);
                    const recipeBook = { id: existingJournal.id, name: existingJournal.name, ownership: existingJournal.ownership, ...existingJournal.flags.mastercrafted };
                    for (const page of existingJournal.pages) {
                        await page.update({ flags: { mastercrafted: { recipeBook } } });
                    }
                    ui.notifications.info(game.i18n.format("emcr.notifications.updateSuccess", { name: bookData.name }));
                } else {
                    const newJournal = await JournalEntry.create({
                        name: bookData.name,
                        folder: folderId,
                        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
                        pages: pages,
                        flags: bookFlags,
                    });
                    const recipeBook = { id: newJournal.id, name: newJournal.name, ownership: newJournal.ownership, ...newJournal.flags.mastercrafted };
                    for (const page of newJournal.pages) {
                        await page.update({ flags: { mastercrafted: { recipeBook } } });
                    }
                    ui.notifications.info(game.i18n.format("emcr.notifications.importSuccess", { name: bookData.name }));
                }
            }
        } catch (error) {
            console.error('Error importing books:', error);
            ui.notifications.error(game.i18n.localize("emcr.notifications.loadFailed"));
        }

        this.close();
    }
}

export {BookImporter};
