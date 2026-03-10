const fs = require('fs');
const path = require('path');

function generateId(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const positiveHash = Math.abs(hash);
    const base36 = positiveHash.toString(36);
    const padded = '0'.repeat(16) + base36;
    return padded.slice(-16);
}

function updateComponents(data, filePath) {
    if (!data || !Array.isArray(data.recipes)) return data;

    const recipes = data.recipes.map((recipe, ri) => {
        const seed = `${filePath}-${recipe.name}-${ri}`;

        const ingredients = (recipe.ingredients || []).map((ingredient, ii) => {
            const ingId = ingredient.id || generateId(`${seed}-ing-${ii}`);
            const components = (ingredient.components || []).map((comp, ci) => {
                const compId = comp.id || generateId(`${seed}-ing-${ii}-comp-${ci}-${comp.uuid}`);
                return {
                    id: compId,
                    uuid: comp.uuid,
                    quantity: Number(comp.quantity) || 1,
                    name: comp.name,
                    img: comp.img || "",
                    tags: comp.tags || [],
                    resourcePath: comp.resourcePath || "",
                };
            });
            return { id: ingId, name: ingredient.name !== undefined ? ingredient.name : null, components };
        });

        const products = (recipe.products || []).map((product, pi) => {
            const prodId = product.id || generateId(`${seed}-prod-${pi}`);
            const components = (product.components || []).map((comp, ci) => {
                const compId = comp.id || generateId(`${seed}-prod-${pi}-comp-${ci}-${comp.uuid}`);
                return {
                    id: compId,
                    uuid: comp.uuid,
                    quantity: Number(comp.quantity) || 1,
                    name: comp.name,
                    img: comp.img || "",
                    tags: comp.tags || [],
                    resourcePath: comp.resourcePath || "",
                };
            });
            return { id: prodId, name: product.name !== undefined ? product.name : null, components };
        });

        return { ...recipe, ingredients, products };
    });

    return { ...data, recipes };
}

function processFolder(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processFolder(fullPath);
        } else if (entry.name.endsWith('.json') && entry.name !== 'index.json') {
            try {
                const raw = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(raw);
                const updated = updateComponents(json, fullPath);
                fs.writeFileSync(fullPath, JSON.stringify(updated, null, 2), 'utf8');
                console.log(`Updated: ${fullPath}`);
            } catch (err) {
                console.error(`Failed on: ${fullPath}`, err);
            }
        }
    }
}

const booksPath = path.join(__dirname, 'books');
processFolder(booksPath);
console.log('All JSON files processed.');
