/**
 * Dialog for adding/editing starting skills - Simple version using Foundry Dialog
 */
export class StartingSkillsDialog {
  
  static async prompt(actor, skillData = null) {
    const isEdit = !!skillData;
    const skill = skillData || { name: "", cost: 0, effect: "", skillType: "origin" };
    
    // Build dialog HTML
    const dialogContent = `
      <form class="starting-skills-form" autocomplete="off">
        <div class="form-group">
          <label for="skill-name">
            <div class="label-row">
              <span class="primary-label">${game.i18n.localize("CONAN.StartingSkills.name")}</span>
              <span class="required">*</span>
            </div>
            <span class="subtitle-label">Skill Name</span>
          </label>
          <input type="text" name="name" id="skill-name" value="${skill.name}" placeholder="${game.i18n.localize('CONAN.StartingSkills.namePlaceholder')}" required />
        </div>
        
        <div class="form-group">
          <label for="skill-effect">
            <span class="primary-label">${game.i18n.localize("CONAN.StartingSkills.effect")}</span>
            <span class="subtitle-label">Effect Description</span>
          </label>
          <textarea name="effect" id="skill-effect" rows="4" placeholder="${game.i18n.localize('CONAN.StartingSkills.effectPlaceholder')}">${skill.effect}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group form-group-small">
            <label for="skill-cost">
              <div class="label-row">
                <span class="primary-label">${game.i18n.localize("CONAN.StartingSkills.cost")}</span>
                <span class="required">*</span>
              </div>
              <span class="subtitle-label">XP Cost</span>
            </label>
            <input type="number" name="cost" id="skill-cost" value="${skill.cost}" min="0" max="100" required />
          </div>
          
          <div class="form-group">
            <label for="skill-type">
              <span class="primary-label">${game.i18n.localize("CONAN.Skill.skillType.label")}</span>
              <span class="subtitle-label">Skill Type</span>
            </label>
            <select name="skillType" id="skill-type">
              <option value="origin" ${skill.skillType === 'origin' ? 'selected' : ''}>${game.i18n.localize("CONAN.Skill.skillType.origin")}</option>
              <option value="legendary" ${skill.skillType === 'legendary' ? 'selected' : ''}>${game.i18n.localize("CONAN.Skill.skillType.legendary")}</option>
              <option value="advanced" ${skill.skillType === 'advanced' ? 'selected' : ''}>${game.i18n.localize("CONAN.Skill.skillType.advanced")}</option>
            </select>
          </div>
        </div>
      </form>
    `;
    
    return foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize("CONAN.StartingSkills.dialogTitle") },
      content: dialogContent,
      classes: ["conan", "dialog", "starting-skills"],
      position: { width: 500 },
      buttons: [
        {
          action: "confirm",
          icon: "fas fa-check",
          label: isEdit ? game.i18n.localize("CONAN.Common.update") : game.i18n.localize("CONAN.Common.add"),
          callback: async (event, button, dialog) => {
            const form = dialog.element.querySelector('form');
            const formData = new FormData(form);

            const data = {
              name: formData.get('name')?.trim() || "",
              cost: parseInt(formData.get('cost')) || 0,
              effect: formData.get('effect')?.trim() || "",
              skillType: formData.get('skillType') || 'origin'
            };

            if (!data.name) {
              ui.notifications.warn(game.i18n.localize("CONAN.StartingSkills.nameRequired"));
              return null;
            }

            if (data.cost < 0) {
              ui.notifications.warn(game.i18n.localize("CONAN.StartingSkills.costRequired"));
              return null;
            }

            const newSkillData = {
              id: skillData?.id || foundry.utils.randomID(),
              name: data.name,
              cost: data.cost,
              effect: data.effect,
              skillType: data.skillType
            };

            const currentSkills = actor.system.startingSkills || [];
            const updatedSkills = isEdit
              ? currentSkills.map(s => s.id === newSkillData.id ? newSkillData : s)
              : [...currentSkills, newSkillData];

            // Calculate XP cost (only non-origin skills)
            const totalCost = updatedSkills
              .filter(s => s.skillType !== 'origin')
              .reduce((sum, s) => sum + s.cost, 0);

            const initialXP = actor.system.initial?.experience || 0;

            if (totalCost > initialXP) {
              ui.notifications.error(game.i18n.localize("CONAN.StartingSkills.notEnoughXP"));
              return null;
            }

            await actor.update({
              "system.startingSkills": updatedSkills,
              "system.experience.value": initialXP - totalCost
            });

            ui.notifications.info(
              isEdit
                ? game.i18n.localize("CONAN.StartingSkills.skillUpdated")
                : game.i18n.localize("CONAN.StartingSkills.skillAdded")
            );

            return newSkillData;
          }
        },
        {
          action: "cancel",
          icon: "fas fa-times",
          label: game.i18n.localize("CONAN.Common.cancel"),
          callback: () => null
        }
      ],
      default: "confirm",
      rejectClose: false
    });
  }
}
