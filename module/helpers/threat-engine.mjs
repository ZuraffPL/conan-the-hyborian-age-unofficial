/**
 * Threat Engine — losuje tier zagrożenia przy wystawieniu tokena na scenę.
 *
 * Minion (sługus):   50% słaby | 30% silny (💀) | 20% elitarny (💀💀)
 * Antagonist:        70% słaby (☠️) | 20% silny (☠️☠️) | 10% elitarny (☠️☠️☠️)
 *
 * Bonus do statystyk: tier 0 → +0, tier 1 → +1, tier 2 → +2
 */

/** Konfiguracje per typ aktora */
const CONFIGS = {
  minion: {
    tiers:  [{ tier: 0, weight: 50 }, { tier: 1, weight: 30 }, { tier: 2, weight: 20 }],
    skulls: ["", "💀", "💀💀"],
  },
  antagonist: {
    tiers:  [{ tier: 0, weight: 70 }, { tier: 1, weight: 20 }, { tier: 2, weight: 10 }],
    skulls: ["☠️", "☠️☠️", "☠️☠️☠️"],
  },
};

// ─── Wewnętrzne helpery ───────────────────────────────────────────────────────

function rollTier(tiers) {
  const total = tiers.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.floor(Math.random() * total);
  for (const t of tiers) {
    roll -= t.weight;
    if (roll < 0) return t.tier;
  }
  return 0;
}

async function doApply(tokenDocument, actorType) {
  const actor = tokenDocument.actor;
  if (!actor || actor.type !== actorType) return;

  if (!actor.system.threatEngineEnabled) return;

  // Linked token = boss — Threat Engine tierów nie dotyczy.
  // Jeśli boss icon jest włączone, owiń nazwę tokena ikonami 💀name💀.
  if (tokenDocument.actorLink) {
    if (actor.system.bossIconEnabled) {
      const cleanName = tokenDocument.name
        .replace(/^💀\s*/, "")
        .replace(/\s*💀$/, "")
        .replace(/\s*💀+$/, "")
        .replace(/\s*(☠️)+$/, "")
        .trim();
      const newName = `💀${cleanName}💀`;
      if (newName !== tokenDocument.name) {
        await tokenDocument.update({ name: newName });
      }
    }
    return;
  }

  const config = CONFIGS[actorType];
  const tier = rollTier(config.tiers);

  const basePhys  = actor.system.defense.basePhysical ?? actor.system.defense.physical ?? 0;
  const baseSorc  = actor.system.defense.sorcery ?? 0;
  const baseArmor = actor.system.armor ?? 0;

  const physVal  = basePhys  + tier;
  const sorcVal  = baseSorc  + tier;
  const armorVal = baseArmor + tier;

  await actor.update({
    "system.defense.physical":     physVal,
    "system.defense.basePhysical": physVal,
    "system.defense.sorcery":      sorcVal,
    "system.armor":                armorVal,
    "system.threatTier":           tier,
  });

  // Usuń stare czaszki obu typów, dopisz nowe
  const suffix = config.skulls[tier];
  const cleanName = tokenDocument.name
    .replace(/\s*💀+$/, "")
    .replace(/\s*(☠️)+$/, "")
    .trim();
  const newName = suffix ? `${cleanName} ${suffix}` : cleanName;
  if (newName !== tokenDocument.name) {
    await tokenDocument.update({ name: newName });
  }

  await tokenDocument.setFlag("conan-the-hyborian-age", "threatTier", tier);

  const tierLabels = [
    game.i18n.localize("CONAN.ThreatEngine.tierWeak"),
    game.i18n.localize("CONAN.ThreatEngine.tierStrong"),
    game.i18n.localize("CONAN.ThreatEngine.tierElite"),
  ];
  const tierColors = ["#aaaaaa", "#e0a820", "#e05020"];
  console.log(
    `%cConan | Threat Engine [${actorType}]: ${newName} — ${tierLabels[tier].toUpperCase()} ` +
    `(tier ${tier}) | OF: ${physVal} | SD: ${sorcVal} | WP: ${armorVal}`,
    `color: ${tierColors[tier]}; font-weight: bold;`
  );
}

// ─── Eksportowane funkcje ─────────────────────────────────────────────────────

/** Aplikuje Threat Engine dla sługusa (minion). */
export async function applyThreatTier(tokenDocument) {
  return doApply(tokenDocument, "minion");
}

/** Aplikuje Threat Engine dla antagonisty. */
export async function applyAntagonistThreatTier(tokenDocument) {
  return doApply(tokenDocument, "antagonist");
}

