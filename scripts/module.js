import { BookImporter } from './book-importer.js';

// Hooks.once('ready', () => {
//     new BookImporter().render(true);
// });

// Add button to Items directory (v13-compatible)
Hooks.on('renderItemDirectory', (app, html) => {
    // Support both HTMLElement and jQuery for ApplicationV2
    const $html = (window.jQuery && html instanceof jQuery) ? html : (window.jQuery ? $(html) : null);

    if (!game.modules.get('mastercrafted')?.active) return;
    if (!game.user.isGM) return;

    // Prevent duplicate button
    if ($html && $html.find('.mcr-sidebar-button').length) return;

    const importButtonHtml = `
    <button type="button" class="mcr-sidebar-button">
      <i class="fas fa-book-open"></i> ${game.i18n.localize('emcr.manageBooks')}
    </button>`;

    let importButton;
    if (window.jQuery) {
        importButton = $(importButtonHtml);
        importButton.on('click', () => new BookImporter().render(true));
    } else {
        // Fallback without jQuery (unlikely in Foundry, but safe)
        const temp = document.createElement('div');
        temp.innerHTML = importButtonHtml.trim();
        importButton = temp.firstElementChild;
        importButton.addEventListener('click', () => new BookImporter().render(true));
    }

    // Find a suitable container to append the button across versions
    let container = null;
    if ($html) {
        container = $html.find('.directory-footer, .footer-actions, .directory-header .header-actions').first();
        if (container && container.length) {
            container.append(importButton);
            return;
        }
        // As a last resort, append to the root element
        $html.append(importButton);
    } else if (html instanceof HTMLElement) {
        container = html.querySelector('.directory-footer')
            || html.querySelector('.footer-actions')
            || html.querySelector('.directory-header .header-actions');
        (container ?? html).append(importButton);
    }
});
