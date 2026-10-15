/**
 * NutriBovino Pro - Core Application Script
 * Precision Bovine Nutrition Calculator & Interactive Experience
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCalculator();
  initBromatologyViewer();
  initPhaseTabs();
  initInfographicLightbox();
  initAiPromptGenerator();
  initFaqAccordion();
});

/* ==========================================================================
   1. Navigation & Mobile Menu
   ========================================================================== */
function initNavigation() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  const links = document.querySelectorAll('.nav-link');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      const isOpen = navLinks.classList.contains('mobile-open');
      toggleBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });
  }

  // Active Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120;
      const sectionId = current.getAttribute('id');
      const matchingLink = document.querySelector(`.nav-link[href*="${sectionId}"]`);

      if (matchingLink) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          matchingLink.classList.add('active');
        } else {
          matchingLink.classList.remove('active');
        }
      }
    });
  });
}

/* ==========================================================================
   2. Interactive Nutri-Calculator
   ========================================================================== */
function initCalculator() {
  const categorySelect = document.getElementById('calc-category');
  const weightInput = document.getElementById('calc-weight');
  const weightDisplay = document.getElementById('weight-display');
  const forageSelect = document.getElementById('calc-forage');
  const concentrateInput = document.getElementById('calc-concentrate');
  const concentrateDisplay = document.getElementById('concentrate-display');
  const recalculateBtn = document.getElementById('calc-recalculate-btn');

  // Result Elements
  const resCms = document.getElementById('res-cms');
  const resCmsPct = document.getElementById('res-cms-pct');
  const resTc = document.getElementById('res-tc');
  const resPc = document.getElementById('res-pc');
  const resPcPct = document.getElementById('res-pc-pct');
  const resNdt = document.getElementById('res-ndt');
  const resEn = document.getElementById('res-en');
  const rumenAlert = document.getElementById('rumen-alert');
  const rumenIcon = document.getElementById('rumen-icon');
  const rumenTitle = document.getElementById('rumen-title');
  const rumenDesc = document.getElementById('rumen-desc');
  const recommendationList = document.getElementById('recommendation-list');

  // Forage Bromatological Profiles (MS %, PC %, FDN %, NDT %)
  const forageProfiles = {
    brachiaria: { ms: 0.23, pc: 0.085, fdn: 0.62, ndt: 0.54, name: 'Brachiaria brizantha' },
    kikuyo: { ms: 0.18, pc: 0.160, fdn: 0.56, ndt: 0.60, name: 'Pasto Kikuyo' },
    ryegrass: { ms: 0.20, pc: 0.200, fdn: 0.46, ndt: 0.68, name: 'Ryegrass perenne' },
    ensilaje_maiz: { ms: 0.32, pc: 0.080, fdn: 0.44, ndt: 0.66, name: 'Ensilaje de Maíz' },
    heno_pangola: { ms: 0.88, pc: 0.070, fdn: 0.68, ndt: 0.52, name: 'Heno de Pangola' }
  };

  // Concentrate Profile
  const concentrateProfile = { ms: 0.89, pc: 0.18, fdn: 0.22, ndt: 0.78 };

  // Category Baseline Intake Factors (% PV)
  const categoryFactors = {
    ceba: 0.026,          // 2.6% PV
    leche_alta: 0.035,    // 3.5% PV
    leche_media: 0.028,   // 2.8% PV
    levante: 0.025,       // 2.5% PV
    vaca_seca: 0.020      // 2.0% PV
  };

  // Update Slider Labels Live
  weightInput.addEventListener('input', (e) => {
    weightDisplay.textContent = `${e.target.value} kg`;
    computeDiet();
  });

  concentrateInput.addEventListener('input', (e) => {
    concentrateDisplay.textContent = `${e.target.value}% de la dieta`;
    computeDiet();
  });

  categorySelect.addEventListener('change', computeDiet);
  forageSelect.addEventListener('change', computeDiet);
  recalculateBtn.addEventListener('click', computeDiet);

  function computeDiet() {
    const weight = parseFloat(weightInput.value);
    const category = categorySelect.value;
    const forageKey = forageSelect.value;
    const concFraction = parseFloat(concentrateInput.value) / 100;
    const forageFraction = 1 - concFraction;

    const forage = forageProfiles[forageKey] || forageProfiles.ensilaje_maiz;
    const baseFactor = categoryFactors[category] || 0.026;

    // Adjust intake factor based on forage FDN (Mertens model constraint: high FDN reduces intake)
    let fdnPenalty = 1.0;
    if (forage.fdn > 0.60) {
      fdnPenalty = 0.92; // 8% physical gut-fill penalty
    } else if (forage.fdn < 0.50) {
      fdnPenalty = 1.05; // 5% boost for highly digestible forage
    }

    const effectiveIntakeRate = baseFactor * fdnPenalty;
    const cmsKg = weight * effectiveIntakeRate;
    const cmsPct = (effectiveIntakeRate * 100).toFixed(2);

    // Diet Composition Weighted
    const dietMsPct = (forage.ms * forageFraction) + (concentrateProfile.ms * concFraction);
    const dietPcPct = (forage.pc * forageFraction) + (concentrateProfile.pc * concFraction);
    const dietNdtPct = (forage.ndt * forageFraction) + (concentrateProfile.ndt * concFraction);
    const dietFdnPct = (forage.fdn * forageFraction) + (concentrateProfile.fdn * concFraction);

    // Consumo Tal Cual (Materia Fresca Total en comedero)
    // Fresh Forage kg = (cmsKg * forageFraction) / forage.ms
    // Fresh Concentrate kg = (cmsKg * concFraction) / concentrateProfile.ms
    const freshForage = (cmsKg * forageFraction) / forage.ms;
    const freshConc = (cmsKg * concFraction) / concentrateProfile.ms;
    const totalFresh = freshForage + freshConc;

    // Total Crude Protein in kg/day
    const totalPcKg = cmsKg * dietPcPct;

    // Energy Estimates (NRC Net Energy Equations based on NDT)
    // NEm (Mcal/kg) = 1.37*ME - 0.138*ME^2 + 0.0105*ME^3 - 1.12 approx
    const enM = (dietNdtPct * 0.044 * 0.82 * 0.65).toFixed(2);
    const enG = (dietNdtPct * 0.044 * 0.82 * 0.40).toFixed(2);

    // Render Outputs
    resCms.innerHTML = `${cmsKg.toFixed(2)} <small>kg MS/día</small>`;
    resCmsPct.textContent = `Equivale al ${cmsPct}% del Peso Vivo (${weight} kg)`;
    resTc.innerHTML = `${totalFresh.toFixed(1)} <small>kg/día</small>`;
    resPc.innerHTML = `${totalPcKg.toFixed(2)} <small>kg PC/día</small>`;
    resPcPct.textContent = `${(dietPcPct * 100).toFixed(1)}% de PC en materia seca`;
    resNdt.innerHTML = `${(dietNdtPct * 100).toFixed(1)} <small>% NDT</small>`;
    resEn.textContent = `ENm: ${enM} Mcal/kg MS | ENg: ${enG} Mcal/kg MS`;

    // Ruminal Health Evaluation
    evaluateRumenHealth(concFraction, dietFdnPct, forage);

    // Update Recommendations List
    generateRecommendations(category, concFraction, forage, weight, totalFresh);
  }

  function evaluateRumenHealth(concFraction, dietFdnPct, forage) {
    if (concFraction >= 0.45) {
      rumenAlert.className = 'rumen-alert-box warning';
      rumenIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
      rumenTitle.textContent = 'Alerta de Riesgo: Acidosis Ruminal Subaguda (SARA)';
      rumenDesc.textContent = `La inclusión de concentrado es alta (${(concFraction*100).toFixed(0)}%). Es indispensable garantizar fibra efectiva larga (>8mm), fraccionar la entrega de grano en 3 o más raciones al día y adicionar bicarbonato sódico (0.75% de la MS).`;
    } else if (dietFdnPct > 0.58) {
      rumenAlert.className = 'rumen-alert-box warning';
      rumenIcon.innerHTML = '<i class="fa-solid fa-hourglass-half"></i>';
      rumenTitle.textContent = 'Límite Físico por Llenado Ruminal (Alta Fibra)';
      rumenDesc.textContent = `El contenido de FDN de la ración (${(dietFdnPct*100).toFixed(1)}%) es elevado. La tasa de digestión es lenta y restringirá el consumo energético voluntario. Considere suplementar con nitrógeno no proteico o forraje más tierno.`;
    } else {
      rumenAlert.className = 'rumen-alert-box';
      rumenIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
      rumenTitle.textContent = 'Ambiente Ruminal Seguro y Balanceado';
      rumenDesc.textContent = 'El equilibrio entre carbohidratos fermentables y fibra efectiva estimula la rumia continua, salivación óptima y mantiene el pH ruminal por encima de 6.2.';
    }
  }

  function generateRecommendations(category, concFraction, forage, weight, totalFresh) {
    const recs = [];

    // Water intake rule (approx 4-5 L water per kg dry matter intake + temperature)
    recs.push(`<strong>Agua de bebida:</strong> Requiere mínimo ${(weight * 0.1).toFixed(0)} a ${(weight * 0.14).toFixed(0)} Litros/día de agua fresca continua.`);

    if (concFraction > 0.2) {
      recs.push(`<strong>Manejo de comederos:</strong> Suministrar el forraje conservado/verde previo al concentrado para generar manto ruminal.`);
    }

    if (category === 'ceba') {
      recs.push(`<strong>Objetivo Ceba:</strong> Con esta ración (${(forage.ndt * 100).toFixed(0)}% NDT forraje), la ganancia esperada ronda 0.85 a 1.25 kg/cabeza/día.`);
    } else if (category.includes('leche')) {
      recs.push(`<strong>Balance Lechería:</strong> Vigilar la relación Grasa:Proteína en leche (debe mantenerse > 1.15 para descartar acidosis).`);
    } else if (category === 'levante') {
      recs.push(`<strong>Desarrollo Óseo:</strong> Mantener fósforo biodisponible en la sal mineralizada al 7% - 8% P.`);
    }

    recommendationList.innerHTML = recs.map(r => `<li><i class="fa-solid fa-check text-success"></i> <span>${r}</span></li>`).join('');
  }

  // Initial calculation run
  computeDiet();
}

/* ==========================================================================
   3. Bromatological Parameter Modal/Viewer
   ========================================================================== */
function initBromatologyViewer() {
  const cards = document.querySelectorAll('.param-card');
  const badgeEl = document.getElementById('det-badge');
  const titleEl = document.getElementById('det-title');
  const formulaEl = document.getElementById('det-formula');
  const physioEl = document.getElementById('det-physio');
  const impactEl = document.getElementById('det-impact');

  const paramDatabase = {
    ms: {
      badge: 'Base Fundamental',
      title: 'Materia Seca (MS)',
      formula: 'Fórmula: $MS = 100 - %Humedad$',
      physio: 'El agua presente en los pastos frescos (que puede llegar al 85%) no aporta nutrientes esenciales. Todos los requerimientos del rumiante se calculan en gramos o kilogramos de Materia Seca. Un animal nunca come "kilos de pasto verde" sino kilos de materia seca que sustentan a las bacterias ruminales.',
      impact: 'Pasturas muy tiernas con menos de 18% de MS provocan un llenado rápido del rumen por agua y heces diarreicas osmóticas, limitando el consumo total de nutrientes y mermando la producción diaria de leche y carne.'
    },
    pc: {
      badge: 'Proteína Total',
      title: 'Proteína Cruda (PC)',
      formula: 'Fórmula: $PC = %Nitrógeno \\times 6.25$',
      physio: 'Representa el nitrógeno total del alimento, compuesto por proteína verdadera y Nitrógeno No Proteico (NNP). En el rumen se degrada en amoníaco ($NH_3$), base con la que las bacterias sintetizan proteína microbiana de alto valor biológico.',
      impact: 'Forrajes con menos del 7% de PC disminuyen la actividad de las bacterias celulolíticas, frenando drásticamente el consumo voluntario por retención de alimento en rumen. En lechería, se requieren niveles de 14% a 18% de PC.'
    },
    fdn: {
      badge: 'Llenado Ruminal',
      title: 'Fibra Neutro Detergente (FDN)',
      formula: 'Fórmula: Celulosa + Hemicelulosa + Lignina',
      physio: 'La FDN mide las paredes celulares vegetales. Constituye la fracción que ocupa más espacio volumétrico en el rumen. A mayor contenido de FDN, mayor tiempo de digestión y de rumia se requiere para reducir el tamaño de partícula.',
      impact: 'Es el principal freno biológico del consumo voluntario ($CMS$). Cuando un pasto tropical sobrepasa el 62% - 65% de FDN, el bovino se llena físicamente mucho antes de cubrir sus demandas calóricas.'
    },
    fda: {
      badge: 'Digestibilidad Inversa',
      title: 'Fibra Ácido Detergente (FDA)',
      formula: 'Fórmula: Celulosa + Lignina insoluble',
      physio: 'Fracción de fibra tratada en detergente ácido que elimina la hemicelulosa, dejando únicamente celulosa y lignina indigestible. Es el estimador analítico más fidedigno de la digestibilidad energética del forraje.',
      impact: 'Existe una correlación estrictamente inversa: a mayor FDA (>38%), menor coeficiente de digestibilidad real del pasto y menor energía neta absorbible para ganancia de masa muscular o síntesis de lactosa.'
    },
    ndt: {
      badge: 'Energía Total',
      title: 'Nutrientes Digestibles Totales (NDT)',
      formula: 'Fórmula: $NDT = PND + FND + ELND + (EED \\times 2.25)$',
      physio: 'Parámetro clásico que expresa en porcentaje el valor energético global de los alimentos, sumando la proteína, carbohidratos no fibrosos, fibra digestible y grasa multiplicada por 2.25 debido a su mayor densidad calórica.',
      impact: 'Permite formular raciones para fijar metas exactas de ganancia diaria de peso vivo (GDPV). Por ejemplo, un novillo en ceba requiere dietas con >68% de NDT para superar ganancias de 1.0 kg/día.'
    },
    fdne: {
      badge: 'Salud Ruminal',
      title: 'Fibra Efectiva (FDNe)',
      formula: 'Fórmula: $FDN \\times %Partículas > 8mm$',
      physio: 'No toda la fibra es químicamente igual a nivel mecánico. La fibra efectiva es aquella con longitud de corte suficiente (>8-19 mm en caja Penn State) para flotar en el saco dorsal del rumen formando el "manto ruminal".',
      impact: 'Estimula la motilidad ruminal y activa el reflejo de masticación, promoviendo la secreción de litros de saliva alcalina rica en bicarbonato sódico para prevenir la temida Acidosis Ruminal Subaguda (SARA).'
    }
  };

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const paramKey = card.getAttribute('data-param');
      const data = paramDatabase[paramKey];
      if (data) {
        badgeEl.textContent = data.badge;
        titleEl.textContent = data.title;
        formulaEl.textContent = data.formula;
        physioEl.textContent = data.physio;
        impactEl.textContent = data.impact;
      }
    });
  });
}

/* ==========================================================================
   4. Production Phases Tabs
   ========================================================================== */
function initPhaseTabs() {
  const tabButtons = document.querySelectorAll('.phase-tab-btn');
  const tagEl = document.getElementById('ph-tag');
  const titleEl = document.getElementById('ph-title');
  const descEl = document.getElementById('ph-desc');
  const pcEl = document.getElementById('ph-pc');
  const ndtEl = document.getElementById('ph-ndt');
  const targetEl = document.getElementById('ph-target');
  const tipEl = document.getElementById('ph-tip');
  const pointsEl = document.getElementById('ph-points');

  const phaseData = {
    cria: {
      tag: 'Fase 1: Transición Prerumiante a Rumiante',
      title: 'Cría y Desarrollo de Papilas Ruminales',
      desc: 'El ternero nace con un rumen no funcional. La fermentación de concentrados iniciadores ricos en almidón produce ácido butírico y propiónico, indispensables para el crecimiento de las papilas ruminales y la absorción de nutrientes.',
      pc: '18% - 22% PC',
      ndt: '> 75% NDT',
      target: 'Consumo de 1.0 - 1.2 kg iniciador/día',
      tip: 'Evite suministrar forrajes groseros de alta lignina antes de los 45 días, ya que causan distensión del rumen sin estímulo de papilas.',
      points: [
        'Suministro de calostro de alta calidad (>50 g IgG/L) en las primeras 6 horas.',
        'Agua potable disponible separada de la leche desde el día 3 de vida.',
        'Iniciador peletizado o quebrado con grano seco no polvoriento.',
        'Transición gradual de 7 a 10 días para el destete definitivo.'
      ]
    },
    levante: {
      tag: 'Fase 2: Estructura Ósea y Muscular',
      title: 'Levante y Recría Eficiente',
      desc: 'Busca maximizar la ganancia de peso a expensas de músculo y esqueleto sin engrasar precozmente al animal. El pastoreo rotacional con forrajes tiernos de óptima proteína es la base más económica y sustentable.',
      pc: '13% - 15% PC',
      ndt: '62% - 66% NDT',
      target: 'Ganancia diaria de 600 - 800 g/día',
      tip: 'Un engrasamiento temprano en hembras de reemplazo reduce irreversiblemente el parénquima mamario y la futura producción de leche.',
      points: [
        'Aprovechamiento de rebrotes de pasto en su punto óptimo de cosecha.',
        'Suplementación estratégica con sales mineralizadas ricas en fósforo (P > 7%).',
        'Uso de nitrógeno no proteico (urea protegida) para estimular bacterias celulolíticas.',
        'Manejo de biomasa forrajera disponible (mínimo 10-12 kg MS ofrecida/100 kg PV).'
      ]
    },
    ceba: {
      tag: 'Fase 3: Deposición Grasa y Rendimiento en Canal',
      title: 'Ceba y Engorde Intensivo (Feedlot / Pastoreo Tecnificado)',
      desc: 'Enfocada en la terminación rápida del animal y el marmoleo adecuado de la carne. La densidad energética se eleva mediante granos, subproductos o ensilaje de maíz para acelerar la conversión alimenticia.',
      pc: '11% - 13% PC',
      ndt: '68% - 74% NDT',
      target: 'Ganancia diaria de 1.1 - 1.5 kg/día',
      tip: 'El cambio de dietas de forraje a granos debe incluir un protocolo de acostumbramiento ruminal de 18 a 21 días para evitar acidosis ruminal aguda.',
      points: [
        'Monitoreo estricto del score de bosta (consistencia óptima tipo volcán).',
        'Inclusión de aditivos moduladores de fermentación ruminal (monensina, levaduras vivas).',
        'Longitud de fibra en el comedero no menor a 2.5 cm para mantener pH > 5.8.',
        'Espacio de comedero suficiente (mínimo 40-50 cm lineales por novillo).'
      ]
    },
    lecheria: {
      tag: 'Fase 4: Alta Demanda Metabólica y Lactancia',
      title: 'Lechería Especializada & Periodo de Transición',
      desc: 'Las vacas de alta producción requieren raciones de altísima densidad con sincronización perfecta entre proteína degradable en rumen (PDR) y carbohidratos solubles, además de proteína de sobrepaso (PNDR).',
      pc: '15% - 18% PC',
      ndt: '70% - 76% NDT',
      target: 'Pico de producción y persistencia > 90%',
      tip: 'En el periodo de transición (21 días preparto), cuide el Balance Catión-Anión de la Dieta (DCAD negativo) para evitar hipocalcemia y fiebre de leche.',
      points: [
        'Maximizar el consumo de materia seca en el periodo posparto temprano.',
        'Suministro de grasas sobrepasantes para amortiguar el balance energético negativo.',
        'Relación forraje:concentrado nunca inferior a 45:55 sobre base seca.',
        'Monitoreo semanal de cetosis subclínica mediante tiras reactivas de beta-hidroxibutirato.'
      ]
    }
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const phaseKey = btn.getAttribute('data-phase');
      const data = phaseData[phaseKey];
      if (data) {
        tagEl.textContent = data.tag;
        titleEl.textContent = data.title;
        descEl.textContent = data.desc;
        pcEl.textContent = data.pc;
        ndtEl.textContent = data.ndt;
        targetEl.textContent = data.target;
        tipEl.textContent = data.tip;
        pointsEl.innerHTML = data.points.map(p => `<li><i class="fa-solid fa-check"></i> <span>${p}</span></li>`).join('');
      }
    });
  });
}

/* ==========================================================================
   5. Infographic Lightbox
   ========================================================================== */
function initInfographicLightbox() {
  const trigger = document.getElementById('infographic-zoom-img');
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('lightbox-close');

  if (trigger && modal) {
    trigger.addEventListener('click', () => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }
}

/* ==========================================================================
   6. AI Prompt Assistant Demo & Copy
   ========================================================================== */
function initAiPromptGenerator() {
  const presetButtons = document.querySelectorAll('.btn-preset');
  const promptBox = document.getElementById('ai-prompt-box');
  const copyBtn = document.getElementById('copy-prompt-btn');

  const prompts = {
    kikuyo: `Actúa como NutriBovino Pro (Experto en Zootecnia y Nutrición de Rumiantes).

Tengo un lote de novillos de levante en pastoreo con pasto Kikuyo maduro en trópico alto. El análisis bromatológico reportó:
- Materia Seca (MS): 18.5%
- Proteína Cruda (PC): 14.8%
- Fibra Detergente Neutro (FDN): 65.2%
- Fibra Detergente Ácido (FDA): 36.1%
- Nutrientes Digestibles Totales (NDT): 56.4%

Por favor:
1. Explica fisiológicamente cómo este valor de $FDN = 65.2\\%$ restringirá el consumo voluntario ($CMS$) por llenado ruminal.
2. Calcula el $CMS$ teórico esperado en base a peso vivo.
3. Propón una estrategia de suplementación con carbohidratos no fibrosos o granos para balancear la ración.`,

    ceba: `Actúa como NutriBovino Pro (Experto en Zootecnia y Nutrición de Rumiantes).

Necesito formular una dieta de ceba intensiva (feedlot) para novillos cruce Cebú x Angus con peso vivo promedio de 420 kg, buscando una ganancia diaria de peso vivo ($GDPV$) de $1.3\\text{ kg/día}$.

Insumos disponibles en finca:
- Ensilaje de maíz (planta entera): $MS = 32\\%$, $PC = 8.0\\%$, $NDT = 66\\%$.
- Torta de soya: $MS = 89\\%$, $PC = 46.0\\%$, $NDT = 82\\%$.
- Maíz molido grano: $MS = 88\\%$, $PC = 8.8\\%$, $NDT = 86\\%$.
- Sal mineralizada al 8% de Fósforo.

Por favor elabora:
1. Requerimientos según tablas NRC/NASEM de $CMS$, $PC$ y $NDT$ para este nivel de ganancia.
2. Inclusión porcentual de cada insumo sobre base seca ($MS$).
3. Cantidades diarias a servir en comedero por animal (base tal cual).
4. Verificación de seguridad ruminal (nivel de Fibra Efectiva $FDN_e$).`,

    leche: `Actúa como NutriBovino Pro (Experto en Zootecnia y Nutrición de Rumiantes).

Explica detalladamente la diferencia metabólica y zootécnica entre la Proteína Degradable en Rumen ($PDR$) y la Proteína No Degradable en Rumen ($PNDR$) para vacas lecheras de alta producción (>30 L/día en primer tercio de lactancia).

Incluye:
1. Cinética del nitrógeno amoniacal ($NH_3$) y síntesis de proteína microbiana.
2. ¿Por qué la sola proteína microbiana no cubre los requerimientos de lisina y metionina en el duodeno para alta producción?
3. Insumos recomendados ricos en $PNDR$ (proteína de escape) y recomendaciones de dosificación práctica.`,

    acidosis: `Actúa como NutriBovino Pro (Experto en Zootecnia y Nutrición de Rumiantes).

En un lote de engorde a corral estamos observando bostas pastosas con burbujas de gas, caída repentina en el consumo de materia seca y animales con masticación reducida.

Dieta actual: 60% grano de maíz quebrado húmedo + 25% ensilaje picado fino (<6mm) + 15% suplemento proteico.

Por favor realiza:
1. Diagnóstico presuntivo enfocado en Acidosis Ruminal Subaguda (SARA) y cinética del ácido láctico/propiónico.
2. Evaluación del tamaño de partícula y nivel de Fibra Efectiva ($FDN_e$).
3. Protocolo de choque inmediato para restablecer el pH ruminal ($> 6.0$).`
  };

  // Set default prompt
  promptBox.value = prompts.kikuyo;

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      presetButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const presetKey = btn.getAttribute('data-preset');
      if (prompts[presetKey]) {
        promptBox.value = prompts[presetKey];
      }
    });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(promptBox.value);
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
      copyBtn.classList.add('btn-primary');
      copyBtn.classList.remove('btn-outline');

      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove('btn-primary');
        copyBtn.classList.add('btn-outline');
      }, 2000);
    } catch (err) {
      promptBox.select();
      document.execCommand('copy');
    }
  });
}

/* ==========================================================================
   7. FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const items = document.querySelectorAll('.accordion-item');

  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      items.forEach(i => i.classList.remove('active'));
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Open first item by default
  if (items.length > 0) {
    items[0].classList.add('active');
  }
}
