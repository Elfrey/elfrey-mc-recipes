const fs = require('fs');
const path = require('path');

const notUpdated = {};

function updateRecipes(data) {
    if (!data || !Array.isArray(data.recipes)) return data;
    const updated = data.recipes.map(recipe => {
        // Example: increment 'time' by 10
        // if (typeof recipe.time === 'number') {
        //     recipe.time += 10;
        // }
        const {time, macroName, description, ...recipeData} = recipe
        const updated = {
            ...recipeData,
        }
        const timeNumber = (parseInt(time, 10) / 60).toString().slice(0, 2);
        const dc = macroName.split('|')[1];
        // console.log(DC);
        const newDescription = `Время крафта (часы): ${timeNumber}<br>
Количество проверок: ${parseInt(timeNumber, 10) / 2}<br>
Сложность крафта: ${dc}`;
        return {
            ...updated,
            time: '',
            macroName: '',
            description: newDescription
        };

    });
    return {
        ...data,
        recipes: updated
    };
}

function processFolder(dir) {
    const entries = fs.readdirSync(dir, {withFileTypes: true});
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            processFolder(fullPath);
        } else if (entry.name.endsWith('.json')) {
            try {
                const raw = fs.readFileSync(fullPath, 'utf8');
                const json = JSON.parse(raw);
                const updated = updateRecipes(json);
                console.debug('updated', updated);
                fs.writeFileSync(fullPath, JSON.stringify(updated, null, 2), 'utf8');
                // console.log(`Updated: ${fullPath}`);
            } catch (err) {
                console.error(`Failed on: ${fullPath}`, err);
            }
        }
    }
}

// Entry point
const booksPath = path.join(__dirname, 'books');
processFolder(booksPath);
console.log('All JSON files processed.');