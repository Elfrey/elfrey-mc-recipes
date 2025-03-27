const MODULE_ID = 'elfrey-mc-recipes';
const MASTERCRAFTED_MODULE_ID = 'mastercrafted';

function generateIdFromName(name) {
    // Convert string to hash number
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert hash to base36 and take last 16 characters
    const positiveHash = Math.abs(hash);
    const base36 = positiveHash.toString(36);

    // Pad with zeros if needed to ensure 16 characters
    const padded = '0'.repeat(16) + base36;
    return padded.slice(-16);
}

class BookImporter extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: `${MODULE_ID}-book-importer`,
            title: game.i18n.localize("emcr.dialog.title"),
            template: `modules/${MODULE_ID}/templates/book-selector.html`,
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

    _removeCircularRefs(obj, seen = new WeakSet()) {
        if (typeof obj === 'object' && obj !== null) {
            if (seen.has(obj)) return;
            seen.add(obj);
            for (const key of Object.keys(obj)) {
                obj[key] = this._removeCircularRefs(obj[key], seen);
            }
        }
        return obj;
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
            const response = await fetch(`modules/${MODULE_ID}/books/index.json`);
            const bookIndex = await response.json();

            this.books = [];

            for (const [category, paths] of Object.entries(bookIndex)) {
                for (const path of paths) {
                    const response = await fetch(`modules/${MODULE_ID}/books/${path}`);
                    const book = await response.json();
                    this.books.push({
                        ...book,
                        path,
                        category,
                        enabled: false
                    });
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
            // Remove active class from all tabs and contents
            html.find('.emcr-tab-item').removeClass('active');
            html.find('.emcr-tab-content').removeClass('active');

            // Add active class to clicked tab and corresponding content
            const tab = ev.currentTarget.dataset.tab;
            ev.currentTarget.classList.add('active');
            html.find(`.emcr-tab-content[data-tab="${tab}"]`).addClass('active');
        });

        html.find('.emcr-book-checkbox').on('change', this._onToggleBook.bind(this));
        html.find('.emcr-import-button').click(this._onImport.bind(this));
        html.find('.emcr-book-checkbox').on('change', this._onToggleBook.bind(this));
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
            let recipeBooks = game.settings.get(MASTERCRAFTED_MODULE_ID, 'recipeBooks') || [];
            const RecipeBook = ui.RecipeApp.RecipeBook;

            for (const book of selectedBooks) {
                const existingBookIndex = recipeBooks.findIndex(b => b.name === book.name);
                const {
                    category, documentName, enabled, path, id, ...restBook
                } = book;
                const newBook = new RecipeBook({
                    ...restBook,
                    id: id ? id : foundry.utils.randomID(),
                });
                const newBookParsed = this._removeCircularRefs(newBook);

                if (existingBookIndex !== -1) {
                    recipeBooks[existingBookIndex] = {
                        ...newBookParsed
                    };
                    ui.notifications.info(game.i18n.format("emcr.notifications.updateSuccess", {name: book.name}));
                } else {
                    recipeBooks.push(newBookParsed);
                    ui.notifications.info(game.i18n.format("emcr.notifications.importSuccess", {name: book.name}));
                }
            }

            await game.settings.set(MASTERCRAFTED_MODULE_ID, 'recipeBooks', recipeBooks);

        } catch (error) {
            console.error('Error importing books:', error);
            ui.notifications.error(game.i18n.localize("emcr.notifications.loadFailed"));
        }

        this.close();
    }
}

export {BookImporter};