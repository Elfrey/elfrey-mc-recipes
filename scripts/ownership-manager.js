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
        const data = {
            users: game.users.contents.filter(user => !user.isGM),
            books: game.settings.get(EMCR_CONST.MASTERCRAFTED_MODULE_ID, 'recipeBooks')
        }
        return data;
    }

    async _updateObject(event, formData) {
        // Process the formData, e.g. apply ownership changes
        console.group(formData.user);
        console.log("Form data:", formData);
        const {
            book,
            permission,
            maxDc,
            user,
        } = formData;

        const recipeBook = ui.RecipeApp.RecipeBook.getName(book)
        console.log(recipeBook);

        if (recipeBook && recipeBook.recipes) {
            recipeBook.recipes.forEach((recipe) => {
                console.log('recipe', recipe);
                const descParts = (recipe.description.match(/(\d+)/g) || []).map(Number);
                if (descParts.length > 0) {

                    const descObj = {
                        time: descParts[0],
                        check: descParts[1],
                        dc: descParts[2]
                    };

                    console.log(`${descObj.dc} < ${maxDc}`, descObj.dc <= maxDc);
                    if (descObj.dc != null && descObj.dc <= maxDc) {
                        recipe.update({
                            ownership: {
                                [user]: permission
                            }
                        })
                    } else {
                        recipe.update({
                            ownership: {
                                [user]: '0'
                            }
                        })
                    }
                    console.log('descObj', descObj);
                }
            })
        }
        console.groupEnd();
        // console.log(ownership);

        // await recipe.update({
        //     ownership: newOwnerShip,
        //     ingredientsInspection: '2',
        //     productInspection: '2'
        // })
    }

    activateListeners(html) {
        super.activateListeners(html);
        // Add event handlers if needed
        // html.find('#emcr-apply-ownership').on('click', this.applyOwnership.bind(this));
    }
}

export {OwnershipManager}