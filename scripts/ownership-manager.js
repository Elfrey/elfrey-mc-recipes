import {EMCR_CONST} from './consts.js';


class OwnershipManager extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('emcr.ownershipManager.title'),
            template: `modules/${EMCR_CONST.MODULE_ID}/templates/ownership-manager.hbs`,
            width: 410,
            height: 350,
        });
    }

    async getData(options = {}) {
        return {
            users: game.users.contents.filter(user => !user.isGM),
            books: game.journal.filter(j => j.flags?.mastercrafted)
        };
    }

    async _updateObject(event, formData) {
        const { book, permission, maxDc, user } = formData;

        const journal = game.journal.getName(book);
        if (!journal) return;

        for (const page of journal.pages) {
            const tempEl = document.createElement('div');
            tempEl.innerHTML = page.text?.content || '';
            const text = tempEl.textContent || '';

            const descParts = (text.match(/(\d+)/g) || []).map(Number);
            if (descParts.length > 0) {
                const dc = descParts[2];
                const newOwnership = { ...page.ownership };
                newOwnership[user] = (dc != null && dc <= maxDc)
                    ? parseInt(permission)
                    : CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE;
                await page.update({ ownership: newOwnership });
            }
        }
    }

    activateListeners(html) {
        super.activateListeners(html);
    }
}

export {OwnershipManager}
