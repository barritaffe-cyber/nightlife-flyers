import {existsSync,readFileSync,writeFileSync} from 'node:fs';
// Keep the homepage search lightweight; do not bundle full editable recipes.
const recipes=JSON.parse(readFileSync('lib/template-data/registered-recipes.json','utf8'));
const catalog=recipes.filter(recipe=>recipe.preview&&existsSync(`public${recipe.preview}`)).map(recipe=>({
 key:recipe.id,name:recipe.label,preview:recipe.preview,
 search:[recipe.label,recipe.recipeSummary||'',...(recipe.tags||[])].join(' '),
}));
writeFileSync('components/landing/designCatalog.json',`${JSON.stringify(catalog,null,2)}\n`);
console.log(`Updated homepage search: ${catalog.length} designs.`);
