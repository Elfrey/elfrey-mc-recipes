import { BookImporter } from './book-importer.js';

// Hooks.once('ready', () => {
//     new BookImporter().render(true);
// });

// Add button to items directory
Hooks.on('renderSidebarTab', async (app, html) => {
    if (html.attr('id') === 'items') {
        // Create the import button
        const importButton = $(`
            <button class="mcr-sidebar-button">
                <i class="fas fa-book-open"></i> ${game.i18n.localize('emcr.importBook')}
            </button>
        `);
        
        // Add click handler
        importButton.click(() => {
            new BookImporter().render(true);
        });

        // Add the button to the items directory header
        const footer = html.find('.directory-footer');
        footer.append(importButton);
    }
});
