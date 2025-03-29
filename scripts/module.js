import { BookImporter } from './book-importer.js';

Hooks.once('ready', () => {
    new BookImporter().render(true);
});

// Add button to items directory
Hooks.on('renderSidebarTab', (app, html) => {
    if (html.attr('id') !== 'items') return;
    if (!game.modules.get('mastercrafted')?.active) return;
    if (!game.user.isGM) return;

    const importButton = $(`
    <button class="mcr-sidebar-button">
      <i class="fas fa-book-open"></i> ${game.i18n.localize('emcr.manageBooks')}
    </button>
  `);

    importButton.click(() => new BookImporter().render(true));

    html.find('.directory-footer').append(importButton);
});
