// Register Handlebars helpers for Conan system
Hooks.once('init', () => {
  Handlebars.registerHelper('includes', function(array, value) {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  });
});
/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */
export async function preloadHandlebarsTemplates() {
  // Load each template individually using getTemplate
  const templates = [
    // Actor sheets
    "systems/conan-the-hyborian-age/templates/actor/actor-character-sheet.hbs",
    "systems/conan-the-hyborian-age/templates/actor/actor-minion-sheet.hbs",
    "systems/conan-the-hyborian-age/templates/actor/actor-antagonist-sheet.hbs",
    
    // Actor partials
    "systems/conan-the-hyborian-age/templates/actor/parts/actor-attributes.hbs",
    "systems/conan-the-hyborian-age/templates/actor/parts/actor-items.hbs",
    "systems/conan-the-hyborian-age/templates/actor/parts/actor-skills.hbs",
    "systems/conan-the-hyborian-age/templates/actor/parts/actor-effects.hbs",
    
    // Item partials
    "systems/conan-the-hyborian-age/templates/item/parts/item-header.hbs",
    "systems/conan-the-hyborian-age/templates/item/parts/item-effects.hbs",
    
    // Dialog templates
    "systems/conan-the-hyborian-age/templates/dialogs/flex-effect.hbs",
    "systems/conan-the-hyborian-age/templates/dialogs/difficulty-dialog.hbs",
    "systems/conan-the-hyborian-age/templates/dialogs/poisoned-dialog.hbs",
    "systems/conan-the-hyborian-age/templates/dialogs/tale-dialog.hbs",
    "systems/conan-the-hyborian-age/templates/dialogs/tale-player-dialog.hbs"
  ];
  
  return Promise.all(templates.map(t => foundry.applications.handlebars.getTemplate(t)));
}
