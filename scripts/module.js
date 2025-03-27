import { BookImporter } from './book-importer.js';

const MODULE_ID = 'elfrey-mc-recipes';

Hooks.once('init', () => {
    game.settings.register(MODULE_ID, 'showDialog', {
        name: 'Show Import Dialog',
        hint: 'Show the recipe book import dialog on page load',
        scope: 'client',
        config: false,
        type: Boolean,
        default: true
    });
});

Hooks.once('ready', () => {
    if (game.settings.get(MODULE_ID, 'showDialog')) {
        new BookImporter().render(true);
    }
});

// Add button to items directory
Hooks.on('renderSidebarTab', async (app, html) => {
    if (html.attr('id') === 'items') {
        // Create the import button
        const importButton = $(`
            <button class="mcr-sidebar-button">
                <i class="fas fa-book-open"></i> Import Recipe Books
            </button>
        `);
        
        // Add click handler
        importButton.click(() => {
            new BookImporter().render(true);
        });

        console.log('importButton', importButton);
        // Add the button to the items directory header
        const footer = html.find('.directory-footer');
        console.log('footer', footer);
        footer.append(importButton);
    }
});
