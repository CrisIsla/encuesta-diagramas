// Diagram preference survey.
//
// Participants rank screenshots of one diagram drawn in different ways. The
// core (checking the config, the order of the screens, ranking and the CSV)
// touches no DOM, so Node can check it; the interface after it only runs in
// a browser.
(function (global) {
  "use strict";

  // ------------------------------------------------------------------ core

  const IMAGE_NAME =
    /^fig(\d+)_(with|no)-attributes_(center|edge)-connection_(old|new)-algorithm$/;

  /** What a screenshot shows, read from its name; null if the name is off. */
  function parseImageName(name) {
    const m = IMAGE_NAME.exec(name);
    return m && { fig: Number(m[1]), attributes: m[2], connection: m[3], algorithm: m[4] };
  }

  /** Lower case, no accents or punctuation, single spaces. */
  const normalize = (text) =>
    (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  /**
   * Scores a one-word answer: "correcta" when it names the place, "casi" when
   * it names the other place the diagram's names also fit, "revisar" when it
   * is neither or both (to score by hand), "vacia" when there is nothing.
   * Accepted phrases are taken out first, so "clínica veterinaria" is not
   * caught by a near miss "clínica".
   */
  function scoreAnswer(answer, accept, near) {
    let rest = ` ${normalize(answer)} `;
    if (!rest.trim()) return "vacia";
    let accepted = false;
    for (const phrase of accept.map(normalize).sort((a, b) => b.length - a.length)) {
      if (rest.includes(` ${phrase} `)) {
        accepted = true;
        rest = rest.split(` ${phrase} `).join("  ");
      }
    }
    const missed = near.map(normalize).some((phrase) => rest.includes(` ${phrase} `));
    if (accepted && !missed) return "correcta";
    if (!accepted && missed) return "casi";
    return "revisar";
  }

  /** A block's questions, with the block's defaults filled in. */
  function questionsOf(block) {
    return (block.questions || []).map((q) => ({
      type: block.type || "rank",
      prompt: block.prompt,
      allowTie: Boolean(block.allowTie),
      ...q,
      block: block.id,
    }));
  }

  const has = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

  /** Everything wrong with a config, one sentence each; empty if it can run. */
  function validate(config) {
    if (!config || !Array.isArray(config.blocks)) {
      return ["questions.js no define window.SURVEY con una lista de bloques (blocks)."];
    }
    const errors = [];
    const images = config.images || {};
    if (!config.id) errors.push("La encuesta no tiene id.");
    for (const [name, file] of Object.entries(images)) {
      if (!parseImageName(name)) {
        errors.push(`El nombre "${name}" no sigue el formato figN_with|no-attributes_center|edge-connection_old|new-algorithm.`);
      }
      if (typeof file !== "string" || !file) errors.push(`La imagen "${name}" no tiene archivo.`);
    }
    const blockIds = new Set();
    const questionIds = new Set();
    for (const block of config.blocks) {
      if (!block.id) errors.push("Hay un bloque sin id.");
      else if (blockIds.has(block.id)) errors.push(`El bloque "${block.id}" está repetido.`);
      blockIds.add(block.id);
      if (block.type === "palabra") {
        if (!block.prompt) errors.push(`El bloque "${block.id}" no tiene enunciado (prompt).`);
        if (!(block.diagrams || []).length) errors.push(`El bloque "${block.id}" no tiene diagramas.`);
        const ids = new Set();
        for (const d of [...(block.practice || []), ...(block.diagrams || [])]) {
          const where = `Diagrama "${d.id}"`;
          if (ids.has(d.id)) errors.push(`${where}: el id está repetido.`);
          ids.add(d.id);
          for (const layout of ["old", "new"])
            if (!d.images || typeof d.images[layout] !== "string") errors.push(`${where}: falta la imagen ${layout}.`);
          if (has(d, "options")) {
            // answered by choosing; the first option is the right one
            if (!Array.isArray(d.options) || d.options.length < 2 || d.options.some((o) => typeof o !== "string" || !o.trim()))
              errors.push(`${where}: options debe ser una lista de al menos dos respuestas, la correcta primero.`);
            else if (new Set(d.options.map(normalize)).size !== d.options.length) errors.push(`${where}: options repite una respuesta.`);
            continue;
          }
          if (!Array.isArray(d.accept) || !d.accept.length) errors.push(`${where}: no tiene respuestas aceptadas (accept).`);
          if (!Array.isArray(d.near)) errors.push(`${where}: near debe ser una lista, aunque esté vacía.`);
        }
        continue;
      }
      if (block.type === "preguntas") {
        if (!(block.diagrams || []).length) errors.push(`El bloque "${block.id}" no tiene diagramas.`);
        if (!(block.timeoutSeconds > 0)) errors.push(`El bloque "${block.id}" necesita timeoutSeconds, los segundos que se dan por pregunta.`);
        const ids = new Set();
        for (const d of [...(block.practice || []), ...(block.diagrams || [])]) {
          const where = `Diagrama "${d.id}"`;
          if (ids.has(d.id)) errors.push(`${where}: el id está repetido.`);
          ids.add(d.id);
          for (const layout of ["old", "new"])
            if (!d.images || typeof d.images[layout] !== "string") errors.push(`${where}: falta la imagen ${layout}.`);
          if (!Array.isArray(d.items) || !d.items.length) errors.push(`${where}: no tiene preguntas (items).`);
          const itemIds = new Set();
          for (const item of d.items || []) {
            const here = `${where}, pregunta "${item.id}"`;
            if (itemIds.has(item.id)) errors.push(`${here}: el id está repetido.`);
            itemIds.add(item.id);
            if (!item.text) errors.push(`${here}: no tiene texto.`);
            if (!Array.isArray(item.options) || item.options.length < 2) errors.push(`${here}: necesita al menos dos opciones.`);
            else if (!item.options.includes(item.answer)) errors.push(`${here}: la respuesta (answer) no está entre las opciones.`);
          }
        }
        // the sets split the test diagrams between the layouts, and each version says which set gets which
        const sets = block.sets || {};
        const inSets = Object.values(sets).flat();
        const test = (block.diagrams || []).map((d) => d.id);
        if (inSets.length !== test.length || test.some((id) => !inSets.includes(id)) || inSets.some((id) => !test.includes(id)))
          errors.push(`El bloque "${block.id}": sets debe repartir exactamente sus diagramas.`);
        if (!(block.versions || []).length) errors.push(`El bloque "${block.id}" no tiene versiones.`);
        for (const v of block.versions || []) {
          const ok = has(sets, v.old) && has(sets, v.new) && v.old !== v.new && ["old", "new"].includes(v.startsWith)
            && (block.practice || []).every((d) => ["old", "new"].includes((v.practice || {})[d.id]));
          if (!ok) errors.push(`El bloque "${block.id}": la versión ${v.version} está mal armada (old, new, startsWith, practice).`);
        }
        continue;
      }
      for (const q of questionsOf(block)) {
        if (!q.id) {
          errors.push(`Una pregunta del bloque "${block.id}" no tiene id.`);
          continue;
        }
        const where = `Pregunta "${q.id}"`;
        if (questionIds.has(q.id)) errors.push(`${where}: el id está repetido.`);
        questionIds.add(q.id);
        if (!q.prompt) errors.push(`${where}: no tiene enunciado (prompt).`);
        if (q.type === "rank") {
          const list = Array.isArray(q.images) ? q.images : [];
          if (q.size !== undefined && !(Array.isArray(q.size) && q.size.length === 2 && q.size.every((n) => n > 0))) {
            errors.push(`${where}: size debe ser [ancho, alto] de sus imágenes.`);
          }
          if (q.zoom !== undefined && !(typeof q.zoom === "number" && q.zoom > 0)) {
            errors.push(`${where}: zoom debe ser un número mayor que 0.`);
          }
          if (list.length < 2) errors.push(`${where}: necesita al menos 2 imágenes.`);
          const seen = new Set();
          for (const name of list) {
            if (seen.has(name)) errors.push(`${where}: "${name}" aparece dos veces.`);
            seen.add(name);
            if (!has(images, name)) errors.push(`${where}: "${name}" no está en images.`);
          }
          const shows = list.map(parseImageName).filter(Boolean);
          const figs = [...new Set(shows.map((s) => `fig${s.fig}`))];
          if (figs.length > 1) errors.push(`${where}: mezcla diagramas distintos (${figs.join(", ")}).`);
          if (new Set(shows.map((s) => s.attributes)).size > 1) {
            errors.push(`${where}: mezcla versiones con y sin atributos.`);
          }
        } else if (q.type === "choice") {
          if (!Array.isArray(q.options) || q.options.length < 2) errors.push(`${where}: necesita al menos 2 opciones.`);
        } else {
          errors.push(`${where}: el tipo "${q.type}" no existe; usa "rank" o "choice".`);
        }
      }
    }
    return errors;
  }

  /** FNV-1a: a 32-bit seed from a string. */
  function hash(text) {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /** mulberry32: a small seeded generator of numbers in [0, 1). */
  function random(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffled(list, rand) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /**
   * The screens one participant goes through: each block's intro, then its
   * questions. The questions of a shuffled block, and the images of every
   * question, are put in an order seeded by the participant code, so a code
   * always gets the same survey. `inOrder` keeps the config's order, for the
   * preview.
   */
  function buildSteps(config, participant, inOrder = false) {
    const rand = random(hash(`${config.id}|${participant}`));
    const steps = [];
    for (const block of config.blocks) {
      if (block.intro) steps.push({ kind: "intro", block: block.id });
      if (block.type === "palabra") {
        // practice first; then every diagram once, half of them (chosen at
        // random) in the old layout and half in the new, in a random order
        const practice = block.practice || [];
        // a diagram's options are shown in a random order of their own, kept as indexes into `options`
        const pick = random(hash(`${config.id}|${participant}|${block.id}|options`));
        const orderOf = (d) => {
          if (!d.options) return undefined;
          const all = d.options.map((_, i) => i);
          return inOrder ? all : shuffled(all, pick);
        };
        for (const d of practice) {
          const layout = inOrder ? "old" : rand() < 0.5 ? "old" : "new";
          steps.push({ kind: "palabra", block: block.id, key: `${block.id}/practica/${d.id}`, diagram: d.id, layout, practice: true, order: orderOf(d) });
        }
        if (practice.length) steps.push({ kind: "practice-end", block: block.id });
        const byId = new Map(block.diagrams.map((d) => [d.id, d]));
        const ids = block.diagrams.map((d) => d.id);
        const drawn = inOrder ? ids : shuffled(ids, rand);
        const layoutOf = new Map(drawn.map((id, i) => [id, (inOrder ? i % 2 : i < Math.floor(ids.length / 2) ? 0 : 1) ? "new" : "old"]));
        for (const id of inOrder ? ids : shuffled(drawn, rand))
          steps.push({ kind: "palabra", block: block.id, key: `${block.id}/${id}`, diagram: id, layout: layoutOf.get(id), practice: false, order: orderOf(byId.get(id)) });
        continue;
      }
      if (block.type === "preguntas") {
        // one of the versions, by the id: the practice in the version's layouts, then its two sets of diagrams
        // taking turns, each set in a random order, starting with the version's layout. Each diagram's
        // questions come one by one, their options in a random order, and then its ease rating.
        const versions = block.versions;
        const version = inOrder ? versions[0] : versions[Math.abs(hash(`${config.id}|${participant}|${block.id}|version`)) % versions.length];
        const pick = random(hash(`${config.id}|${participant}|${block.id}|options`));
        const byId = new Map([...(block.practice || []), ...block.diagrams].map((d) => [d.id, d]));
        const add = (d, layout, practice) => {
          const prefix = `${block.id}/${practice ? "practica/" : ""}${d.id}`;
          for (const item of d.items) {
            const all = item.options.map((_, i) => i);
            steps.push({ kind: "pregunta", block: block.id, key: `${prefix}/${item.id}`, diagram: d.id, item: item.id, layout, practice, version: version.version, order: inOrder ? all : shuffled(all, pick) });
          }
          steps.push({ kind: "facilidad", block: block.id, key: `${prefix}/facilidad`, diagram: d.id, layout, practice, version: version.version });
        };
        for (const d of block.practice || []) add(d, version.practice[d.id], true);
        if ((block.practice || []).length) steps.push({ kind: "practice-end", block: block.id });
        const other = version.startsWith === "old" ? "new" : "old";
        const first = inOrder ? block.sets[version[version.startsWith]] : shuffled(block.sets[version[version.startsWith]], rand);
        const second = inOrder ? block.sets[version[other]] : shuffled(block.sets[version[other]], rand);
        for (let i = 0; i < Math.max(first.length, second.length); i++) {
          if (first[i]) add(byId.get(first[i]), version.startsWith, false);
          if (second[i]) add(byId.get(second[i]), other, false);
        }
        continue;
      }
      const questions = questionsOf(block);
      for (const q of block.shuffle && !inOrder ? shuffled(questions, rand) : questions) {
        const step = { kind: "question", block: block.id, question: q.id };
        if (q.type === "rank") step.shown = inOrder ? q.images.slice() : shuffled(q.images, rand);
        steps.push(step);
      }
    }
    return steps;
  }

  /**
   * Tapping a ranked image takes it out and the ones after it move up;
   * tapping another ranks it next, and when that leaves one image unranked
   * it goes last, so a pair takes a single tap.
   */
  function toggleRank(ranking, image, all) {
    if (ranking.includes(image)) return ranking.filter((x) => x !== image);
    const next = [...ranking, image];
    if (next.length === all.length - 1) next.push(all.find((x) => !next.includes(x)));
    return next;
  }

  function isAnswered(q, answer) {
    if (!answer) return false;
    if (q.type === "rank") return Boolean(answer.tie) || (answer.ranking || []).length === q.images.length;
    return (answer.choice || []).length > 0 || Boolean((answer.other || "").trim());
  }

  const COLUMNS = [
    "participant", "survey", "block", "question", "seq", "type",
    "practice", "layout", "answer", "score", "expected", "options", "first_key_ms",
    "image", "fig", "attributes", "connection", "algorithm", "shown_pos", "rank", "tie",
    "choice", "comment", "ms", "zoom_opens", "item", "item_type", "dont_know", "timeout", "rating", "version",
    "image_format", "interrupted", "screen", "touch", "started_at", "finished_at",
  ];

  /**
   * The long table: a row per diagram of the palabra part, a row per question
   * and per rating of the preguntas part, a row per image of each rank
   * question, one per choice question.
   */
  function rowsOf(session) {
    const device = session.device || {};
    const rows = [];
    let seq = 0;
    for (const step of session.steps) {
      if (step.kind === "pregunta" || step.kind === "facilidad") {
        seq += 1;
        const a = session.answers[step.key] || {};
        rows.push({
          participant: session.participant, survey: session.survey, block: step.block, question: step.diagram, seq,
          type: step.kind, practice: step.practice ? 1 : 0, layout: step.layout, version: step.version ?? "",
          item: step.kind === "pregunta" ? step.item : "facilidad", item_type: a.itemType ?? "",
          answer: a.text ?? "", score: a.score ?? "", expected: a.expected ?? "", options: (a.options || []).join(" / "), shown_pos: a.position ?? "",
          dont_know: step.kind === "pregunta" ? (a.dontKnow ? 1 : 0) : "", timeout: step.kind === "pregunta" ? (a.timeout ? 1 : 0) : "",
          rating: a.value ?? "", ms: a.ms == null ? "" : Math.round(a.ms), interrupted: a.interrupted ? 1 : 0, zoom_opens: a.zooms ?? "",
          screen: `${device.width}x${device.height}`, touch: device.touch ? 1 : 0,
          started_at: session.startedAt, finished_at: session.finishedAt || "",
        });
        continue;
      }
      if (step.kind === "palabra") {
        seq += 1;
        const a = session.answers[step.key] || {};
        rows.push({
          participant: session.participant, survey: session.survey, block: step.block, question: step.diagram, seq,
          type: "palabra", practice: step.practice ? 1 : 0, layout: step.layout, answer: a.text ?? "", score: a.score ?? "",
          expected: a.expected ?? "", options: (a.options || []).join(" / "), shown_pos: a.position ?? "",
          first_key_ms: a.firstKeyMs == null ? "" : Math.round(a.firstKeyMs),
          ms: a.ms == null ? "" : Math.round(a.ms), interrupted: a.interrupted ? 1 : 0, zoom_opens: a.zooms ?? "",
          screen: `${device.width}x${device.height}`, touch: device.touch ? 1 : 0,
          started_at: session.startedAt, finished_at: session.finishedAt || "",
        });
        continue;
      }
      if (step.kind !== "question") continue;
      seq += 1;
      const a = session.answers[step.question] || {};
      const base = {
        participant: session.participant,
        survey: session.survey,
        block: step.block,
        question: step.question,
        seq,
        comment: a.comment || "",
        ms: Math.round(a.ms || 0),
        screen: `${device.width}x${device.height}`,
        touch: device.touch ? 1 : 0,
        started_at: session.startedAt,
        finished_at: session.finishedAt || "",
      };
      if (step.shown) {
        const ranking = a.ranking || [];
        step.shown.forEach((image, i) => {
          rows.push({
            ...base,
            type: "rank",
            image,
            ...parseImageName(image),
            shown_pos: i + 1,
            rank: !a.tie && ranking.includes(image) ? ranking.indexOf(image) + 1 : "",
            tie: a.tie ? 1 : 0,
            zoom_opens: (a.zoomOpens || {})[image] || 0,
            image_format: (a.formats || {})[image] || "",
          });
        });
      } else {
        const choice = [...(a.choice || [])];
        if ((a.other || "").trim()) choice.push(`otro: ${a.other.trim()}`);
        rows.push({ ...base, type: "choice", choice: choice.join("; ") });
      }
    }
    return rows;
  }

  /** CSV with a BOM, so Excel reads the accents as UTF-8. */
  function toCSV(rows) {
    const cell = (value) => {
      const text = value == null ? "" : String(value);
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [COLUMNS.join(","), ...rows.map((row) => COLUMNS.map((c) => cell(row[c])).join(","))];
    return `﻿${lines.join("\r\n")}\r\n`;
  }

  const core = {
    parseImageName, questionsOf, validate, hash, random, shuffled, buildSteps,
    toggleRank, isAnswered, rowsOf, toCSV, COLUMNS, normalize, scoreAnswer,
  };
  global.SurveyCore = core;
  if (typeof module === "object" && module.exports) module.exports = core;
  if (typeof document === "undefined") return;

  // ------------------------------------------------------------- interface

  const config = global.SURVEY;
  // set by `npm run dev`, to look the survey over: «Comenzar» goes to the preview and the welcome page lists every screen
  const dev = Boolean(global.SURVEY_DEV);
  const app = document.getElementById("app");
  const viewer = document.getElementById("viewer");
  // a question's screenshots are all cropped to one box, given as `size`; this is the uncropped canvas
  const CANVAS = [1437, 919];
  const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  // the welcome page's drawing: an entity, a relationship and an attribute, in ERdoc's colours
  const MARK = `<svg viewBox="0 0 132 44" xmlns="http://www.w3.org/2000/svg">
    <path d="M38 22h14M80 22h16" stroke="#64748b" stroke-width="1.5"/>
    <rect x="2" y="10" width="36" height="24" rx="3" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
    <path d="M66 6l16 16-16 16-16-16z" fill="#fed7aa" stroke="#f97316" stroke-width="1.5"/>
    <ellipse cx="113" cy="22" rx="17" ry="11" fill="#fef3c7" stroke="#eab308" stroke-width="1.5"/>
  </svg>`;

  let blocks = new Map();
  let questions = new Map();
  let session = null; // the survey being answered, or the preview's
  let preview = false; // browsing the questions at #preview: nothing is kept
  let onQuestion = false; // a question is on screen, so its time runs
  let shownAt = 0; // when that time last started
  let screen = null; // the rank question on screen, for the viewer and resizes
  let trial = null; // a diagram on screen to answer about: when it appeared, and whether it was interrupted
  let timer = 0; // the time limit of the question on screen
  let preloaded = []; // the next ranking's images, held so the browser doesn't drop them before they're shown

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else if (key === "class") el.className = value;
      else if (key === "style") el.style.cssText = value;
      else el.setAttribute(key, value === true ? "" : value);
    }
    el.append(...children.flat().filter((c) => c != null && c !== false));
    return el;
  }

  function show(...nodes) {
    screen = null;
    trial = null;
    clearTimeout(timer);
    onQuestion = false;
    shownAt = 0;
    app.replaceChildren(...nodes);
    window.scrollTo(0, 0);
  }

  const paragraphs = (text) => (text || "").split(/\n\s*\n/).map((p) => h("p", {}, p.trim()));

  // Browser storage only keeps a half-done survey across a reload and the
  // finished ones for #resultados; without it (a private window) the survey
  // still runs and just forgets.
  const storeKey = (name) => `survey:${config.id}:${name}`;

  function load(name, fallback) {
    try {
      const text = localStorage.getItem(storeKey(name));
      return text ? JSON.parse(text) : fallback;
    } catch {
      return fallback;
    }
  }

  function store(name, value) {
    try {
      if (value == null) localStorage.removeItem(storeKey(name));
      else localStorage.setItem(storeKey(name), JSON.stringify(value));
    } catch {
      // the survey goes on without it
    }
  }

  function persist() {
    if (!preview) store("current", session);
  }

  /** Adds a session to the ones this browser keeps for #resultados. */
  function keep(s) {
    const done = load("done", []).filter((d) => !(d.participant === s.participant && d.startedAt === s.startedAt));
    store("done", [...done, s]);
  }

  function answerOf(step) {
    return (session.answers[step.question] ||= {
      ranking: [], tie: false, comment: "", choice: [], other: "", ms: 0, zoomOpens: {},
    });
  }

  const answerable = (step) => step.kind === "question" || (["palabra", "pregunta", "facilidad"].includes(step.kind) && !step.practice);
  // «Pregunta N de M» counts within the block on screen, so the rankings go 1 to 10 whatever comes before them
  const inBlock = (s, step) => s.steps.filter((x) => x.kind === "question" && x.block === step.block);
  const questionCount = (s, step) => inBlock(s, step).length;
  const questionNumber = (s, step) => Math.min(inBlock({ steps: s.steps.slice(0, s.position) }, step).length + 1, questionCount(s, step));
  const isLast = () => session.position === session.steps.length - 1;
  const newCode = () =>
    `P-${Array.from({ length: 8 }, () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join("")}`;
  const fileSafe = (text) => text.replace(/[^\w-]+/g, "_");

  function palabraDiagram(step) {
    const block = blocks.get(step.block);
    return [...(block.practice || []), ...block.diagrams].find((d) => d.id === step.diagram);
  }
  const itemOf = (step) => palabraDiagram(step).items.find((i) => i.id === step.item);
  // the right answer of a step's diagram or question, for the practice feedback and the preview
  const rightAnswer = (step) => (step.kind === "pregunta" ? itemOf(step).answer : (palabraDiagram(step).options || [])[0]);

  // The ranking screenshots are SVGs, each with a PNG twin. WebKit (Safari, and every browser on an iPhone or
  // iPad) draws these SVGs at their own size whatever size the page gives them (WebKit bug 23113), so only
  // Chrome and Firefox get the SVGs. ?png or ?svg in the address forces one, to compare the two.
  const params = new URLSearchParams(location.search);
  const ua = navigator.userAgent;
  const webkit = navigator.vendor === "Apple Computer, Inc." || (/AppleWebKit\//.test(ua) && !/(Chrome|Chromium)\//.test(ua));
  const svgOk = !webkit && /(Chrome|Chromium|Firefox)\//.test(ua);
  const pngImages = params.has("png") || (!params.has("svg") && !svgOk);
  // this page without a #screen, where leaving the preview goes, and without ?png/?svg, so whoever starts next gets
  // their browser's own format; dev mode keeps them, as nobody starts a real survey there. Not location.pathname:
  // on a network path Firefox's address is file://///host/…, and its path alone would lose the host.
  const home = location.href.replace(dev ? /#.*$/ : /[?#].*$/, "");
  const imageUrl = (image) => (pngImages ? config.images[image].replace(/\.svg$/, ".png") : config.images[image]);

  function describe(image) {
    const s = SurveyCore.parseImageName(image);
    return `${s.connection === "center" ? "centro" : "borde"} · ${s.algorithm === "new" ? "nuevo" : "antiguo"}`;
  }

  // ---------------------------------------------------------------- routes

  function route() {
    closeViewer();
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash === "resultados") return renderResults();
    const match = /^preview(?:=(.+))?$/.exec(hash);
    if (match) return startPreview(match[1] || "0");
    preview = false;
    session = load("current", null);
    // a session saved under questions that have since changed can't go on
    const known = (step) =>
      step.kind === "question" ? questions.has(step.question)
        : step.kind === "palabra" ? Boolean(blocks.has(step.block) && palabraDiagram(step))
          : blocks.has(step.block);
    if (session && !(Array.isArray(session.steps) && session.steps.every(known))) session = null;
    renderWelcome();
  }

  function start(participant) {
    session = {
      survey: config.id,
      participant,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      device: {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio || 1,
        touch: window.matchMedia("(pointer: coarse)").matches,
        userAgent: navigator.userAgent,
      },
      steps: SurveyCore.buildSteps(config, participant),
      position: 0,
      answers: {},
    };
    go(0);
  }

  /**
   * `target` is a number that counts the rankings ("0" starts at the very beginning), or the id of a
   * block (perfil, palabra), of a question or of a diagram, where the preview starts. A diagram's id may
   * come after its block's (preguntas/p2-taller: two blocks have a p2-taller) and before a layout
   * (5-hospital/new), which every screen of that diagram then shows.
   */
  function startPreview(target) {
    preview = true;
    session = {
      survey: config.id,
      participant: "preview",
      startedAt: new Date().toISOString(),
      finishedAt: null,
      device: {},
      steps: SurveyCore.buildSteps(config, "preview", true),
      position: 0,
      answers: {},
    };
    const parts = target.split("/");
    const layout = parts.length > 1 && ["old", "new"].includes(parts[parts.length - 1]) ? parts.pop() : null;
    const [n, block] = [parts.pop(), parts.pop()];
    let count = 0;
    const position = /^\d+$/.test(n) && !block
      ? session.steps.findIndex((step) => step.shown && ++count === Number(n))
      : session.steps.findIndex((step) => (!block || step.block === block) && [step.block, step.question, step.diagram].includes(n));
    const first = session.steps[position];
    if (layout && first && first.diagram)
      for (const step of session.steps) if (step.block === first.block && step.diagram === first.diagram) step.layout = layout;
    go(Math.max(0, position));
  }

  function go(position) {
    leave();
    session.position = position;
    persist();
    if (position >= session.steps.length) return finish();
    const step = session.steps[position];
    if (step.kind === "intro") renderIntro(step);
    else if (step.kind === "practice-end") renderPracticeEnd(step);
    else if (step.kind === "palabra" || step.kind === "pregunta") renderPalabraReady(step);
    else if (step.kind === "facilidad") renderRating(step);
    else if (questions.get(step.question).type === "rank") renderRank(step);
    else renderChoice(step);
  }

  /** Adds the time spent on the question being left to its answer. */
  function leave() {
    if (onQuestion && shownAt) answerOf(session.steps[session.position]).ms += performance.now() - shownAt;
    onQuestion = false;
    shownAt = 0;
  }

  function finish() {
    if (preview) {
      // back to the start, without ?png or ?svg outside dev mode (see `home`)
      location.assign(home);
      return;
    }
    session.finishedAt = session.finishedAt || new Date().toISOString();
    keep(session);
    store("current", null);
    renderThanks(session);
  }

  function discard() {
    const ok = confirm("¿Descartar la encuesta sin terminar? Lo que alcanzó a responder queda guardado como incompleto.");
    if (!ok) return;
    keep(session);
    store("current", null);
    session = null;
    renderWelcome();
  }

  // --------------------------------------------------------------- screens

  function renderWelcome() {
    // dev mode leaves a participant's unfinished survey alone, for when the survey runs for real again
    const pending = !dev && session && session.position < session.steps.length ? session : null;
    const mark = h("div", { class: "mark", "aria-hidden": "true" });
    mark.innerHTML = MARK;
    // the participant's id is made up here and never shown: it only tells the answers apart
    const begin = dev ? () => { location.hash = "preview"; } : () => start(newCode());
    show(
      h("section", { class: "page narrow" },
        mark,
        h("h1", {}, config.title),
        paragraphs(config.welcome),
        pending
          ? h("div", { class: "notice" },
              h("p", {}, "Hay una encuesta sin terminar en este navegador."),
              h("div", { class: "row" },
                h("button", { class: "primary big", onclick: () => go(pending.position) }, "Continuar"),
                h("button", { onclick: discard }, "Descartarla y empezar otra")))
          : h("div", { class: "start" },
              h("button", { class: "primary big", onclick: begin }, "Comenzar")),
        dev ? devIndex() : null));
    sendPending();
  }

  /**
   * Dev mode's list of every screen. Each opens in the preview, so the questions can be looked at in
   * any order, and the diagrams of the one-at-a-time parts in either layout. A diagram's links name its
   * block too, as two blocks can have a diagram with the same id.
   */
  function devIndex() {
    const link = (target, ...text) => h("a", { href: `#preview=${target}` }, text);
    const code = (text) => h("code", {}, text);
    const note = (text) => h("span", { class: "muted" }, text);
    const about = (block, d) => [(block.practice || []).includes(d) ? "práctica" : null,
      d.items ? `${d.items.length} pregunta${d.items.length === 1 ? "" : "s"}` : null].filter(Boolean).join(", ");
    return h("nav", { class: "dev-index", "aria-label": "Pantallas de la encuesta" },
      h("p", {}, h("strong", {}, "Modo dev:"), " no se guarda nada y da igual lo que respondas. Abre cualquier pantalla, en el orden que quieras:"),
      config.blocks.flatMap((block) => [
        h("h2", {}, block.intro ? block.intro.title : block.id),
        h("ul", {},
          block.intro ? h("li", {}, link(block.id, "Introducción")) : null,
          block.diagrams
            ? [...(block.practice || []), ...block.diagrams].map((d) =>
                h("li", {}, code(d.id), " ", link(`${block.id}/${d.id}/old`, "antiguo"), " · ", link(`${block.id}/${d.id}/new`, "nuevo"),
                  about(block, d) ? note(` (${about(block, d)})`) : null))
            : questionsOf(block).map((q) =>
                h("li", {}, link(q.id, code(q.id)), " ", note(q.type === "rank" ? `${q.images.length} versiones` : q.prompt)))),
      ]));
  }

  // ------------------------------------------------------------ the server

  // Where the answers go: the server this page came from, or `endpoint` in
  // questions.js. Opened as a file, they stay in the browser and get downloaded.
  const ENDPOINT = config.endpoint || (/^https?:$/.test(location.protocol) ? "api/respuestas" : null);

  async function upload(s) {
    const response = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!(await response.json()).ok) throw new Error("rechazada");
    s.sentAt = new Date().toISOString();
    keep(s);
  }

  /** Sends, quietly, what an earlier attempt couldn't. */
  function sendPending() {
    if (!ENDPOINT) return;
    for (const s of load("done", []).filter((d) => d.finishedAt && !d.sentAt)) upload(s).catch(() => {});
  }

  function progress(step) {
    const total = session.steps.filter(answerable).length;
    const done = session.steps.slice(0, session.position).filter(answerable).length;
    const label = step.kind === "question" ? `Pregunta ${questionNumber(session, step)} de ${questionCount(session, step)}` : `${done} de ${total} respondidas`;
    return h("div", { class: "progress" },
      h("span", {}, label),
      h("span", { class: "progress-bar", "aria-hidden": "true" }, h("span", { style: `width: ${(100 * done) / total}%` })));
  }

  function previewBar(step) {
    if (!preview) return null;
    const q = step.kind === "question" ? questions.get(step.question) : null;
    const shows = q && q.type === "rank" ? SurveyCore.parseImageName(q.images[0]) : null;
    return h("div", { class: "preview-bar" },
      h("strong", {}, "Vista previa"),
      h("span", {}, "no se guarda nada"),
      q ? h("code", {}, q.id)
        : step.kind === "palabra" || step.kind === "pregunta"
          ? h("span", {}, `«${step.diagram}» en el layout ${step.layout === "old" ? "antiguo" : "nuevo"}${
            rightAnswer(step) ? ` · correcta: «${rightAnswer(step)}»` : ""}`)
          : step.kind === "facilidad"
            ? h("span", {}, `«${step.diagram}»: facilidad`)
            : h("span", {}, `introducción de «${step.block}»`),
      shows ? h("span", {}, `fig${shows.fig} · ${shows.attributes === "with" ? "con" : "sin"} atributos · tarjetas: conexión · algoritmo`) : null,
      // like the end of the preview, it goes to `home`, which in dev mode holds the list of screens
      h("a", { href: home }, dev ? "Índice" : "Salir"));
  }

  /** Back only within a block, so what a later block points out can't change earlier answers. */
  function backButton() {
    const previous = session.steps[session.position - 1];
    const allowed = previous && (preview || previous.block === session.steps[session.position].block);
    return allowed ? h("button", { onclick: () => go(session.position - 1) }, "← Anterior") : null;
  }

  function nextButton(q, answer, big) {
    const button = h("button", { class: big ? "primary big" : "primary", onclick: () => go(session.position + 1) },
      isLast() ? "Terminar" : "Siguiente →");
    button.disabled = !preview && !SurveyCore.isAnswered(q, answer);
    return button;
  }

  /** The preview's «Siguiente» on a diagram's screens and its rating, which otherwise only go on with an answer. */
  function skipButton() {
    return h("button", { onclick: () => go(session.position + 1) }, isLast() ? "Terminar" : "Siguiente →");
  }

  function renderIntro(step) {
    const { intro } = blocks.get(step.block);
    // «Parte 1 de 2: ¿Cuál te gusta más?» goes up as a small heading over the title
    const [, eyebrow, title] = /^([^:]+): (.+)$/.exec(intro.title) || [null, null, intro.title];
    show(
      h("section", { class: "page narrow" },
        previewBar(step),
        progress(step),
        h("h1", {}, eyebrow ? h("span", { class: "eyebrow" }, eyebrow) : null, title),
        paragraphs(intro.text),
        h("div", { class: "row" },
          backButton(),
          h("button", { class: "primary big", onclick: () => go(session.position + 1) }, "Continuar"))));
    // the first ranking after the intro, or the diagrams of a one-at-a-time block, load while it is read
    preloadNext();
    if (blocks.get(step.block).diagrams) {
      const loaded = new Set();
      for (const s of session.steps)
        if ((s.kind === "palabra" || s.kind === "pregunta") && s.block === step.block && !loaded.has(s.key)) {
          loaded.add(s.key);
          new Image().src = palabraDiagram(s).images[s.layout];
        }
    }
  }

  function renderPracticeEnd(step) {
    const questions = blocks.get(step.block).type === "preguntas";
    show(
      h("section", { class: "page narrow" },
        previewBar(step),
        progress(step),
        h("h1", {}, "Terminó la práctica"),
        h("p", {}, `Ahora empiezan los diagramas de verdad. Ya no verás ${questions ? "si acertaste" : "la respuesta esperada"}.`),
        h("div", { class: "row" },
          h("button", { class: "primary big", onclick: () => go(session.position + 1) }, "Continuar"))));
  }

  /** «Diagrama 3 de 8», and for a question also which of the diagram's questions it is. */
  function palabraLabel(step) {
    if (step.kind === "pregunta") {
      const diagrams = [...new Set(session.steps.filter((s) => s.kind === "pregunta" && s.block === step.block && s.practice === step.practice).map((s) => s.diagram))];
      const items = palabraDiagram(step).items;
      const parts = [step.practice ? "Práctica" : null, `Diagrama ${diagrams.indexOf(step.diagram) + 1} de ${diagrams.length}`,
        `Pregunta ${items.findIndex((i) => i.id === step.item) + 1} de ${items.length}`];
      return h("p", { class: "step-label" }, parts.filter(Boolean).join(" · "));
    }
    const trials = session.steps.filter((s) => s.kind === "palabra" && !s.practice);
    return h("p", { class: "step-label" }, step.practice ? "Práctica" : `Diagrama ${trials.indexOf(step) + 1} de ${trials.length}`);
  }

  /** Before each diagram: the question and a button, so the clock starts with the diagram. */
  function renderPalabraReady(step) {
    const block = blocks.get(step.block);
    // what the time limit left unanswered is said here, once
    const notice = session.notice;
    session.notice = null;
    show(
      h("section", { class: "page narrow" },
        previewBar(step),
        palabraLabel(step),
        notice ? h("p", { class: "timeout-note" }, notice) : null,
        h("h2", {}, step.kind === "pregunta" ? itemOf(step).text : block.prompt),
        h("p", { class: "hint" }, block.hint || ""),
        h("div", { class: "row" },
          // the preview goes either way without seeing the diagram, as it does on every other screen
          preview ? backButton() : null,
          h("button", { class: "primary big", id: "reveal", onclick: () => revealPalabra(step) }, "Ver diagrama"),
          preview ? skipButton() : null)));
    document.getElementById("reveal").focus();
  }

  /** After a diagram's questions: how easy they were, 1 to 7. */
  function renderRating(step) {
    const pick = (value) => {
      session.answers[step.key] = { value };
      go(session.position + 1);
    };
    show(
      h("section", { class: "page narrow" },
        previewBar(step),
        h("p", { class: "step-label" }, step.practice ? "Práctica" : "Sobre este diagrama"),
        h("h2", {}, "En general, ¿qué tan fácil fue responder las preguntas de este diagrama?"),
        h("div", { class: "scale" }, [1, 2, 3, 4, 5, 6, 7].map((n) => h("button", { type: "button", onclick: () => pick(n) }, String(n)))),
        h("div", { class: "scale-labels" }, h("span", {}, "1 = muy difícil"), h("span", {}, "7 = muy fácil")),
        // the preview goes on without a rating, too
        preview ? h("div", { class: "row" }, backButton(), skipButton()) : null));
  }

  /**
   * The diagram as large as the screen allows, with the answer beside it: a
   * tap on one of its options, or typed when it has none. Times the answer
   * (and the first keystroke when typed).
   */
  async function revealPalabra(step) {
    const block = blocks.get(step.block);
    const d = palabraDiagram(step);
    const img = h("img", { class: "stimulus", src: d.images[step.layout], alt: "Diagrama entidad-relación" });
    const area = h("div", { class: "stimulus-area" }, img);
    // a tap on the diagram shows it large around that point, for phones; another fits it again
    let zoomed = false;
    let zooms = 0;
    img.addEventListener("click", (e) => {
      const box = img.getBoundingClientRect();
      const focus = { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height };
      zoomed = !zoomed;
      area.classList.toggle("zoomed", zoomed);
      // ERdoc's own size (the crop's width at zoom 1), like the viewer's «Acercar», and at least half again the fitted size
      const own = d.size && d.zoom ? d.size[0] / d.zoom : 0;
      img.style.width = zoomed ? `${Math.round(Math.max(own, box.width * 1.5))}px` : "";
      if (zoomed) {
        zooms += 1;
        area.scrollLeft = focus.x * img.offsetWidth - area.clientWidth / 2;
        area.scrollTop = focus.y * img.offsetHeight - area.clientHeight / 2;
      }
    });
    // a question about the diagram, or the diagram's own options («¿qué representa?»)
    const item = step.kind === "pregunta" ? itemOf(step) : null;
    const given = item ? item.options : d.options;
    const right = item ? item.answer : (d.options || [])[0];
    // the options in this person's order; they wait, disabled, until the diagram is on screen
    const shown = given ? (step.order || given.map((_, i) => i)).map((i) => given[i]) : null;
    const choices = (shown || []).map((option, i) =>
      h("button", { class: "option", type: "button", disabled: true, onclick: () => submit(i) }, option));
    if (item) choices.push(h("button", { class: "option dont-know", type: "button", disabled: true, onclick: () => submit(-1) }, "No sé"));
    const input = shown ? null : h("input", { id: "answer", type: "text", maxlength: "80", autocomplete: "off", spellcheck: "false", placeholder: "Una o dos palabras" });
    const next = shown ? null : h("button", { class: "primary big", disabled: true }, "Siguiente");
    let firstKey = null;
    const finish = (answer) => {
      session.answers[step.key] = { ...answer, interrupted: trial.interrupted, zooms };
      session.inTrial = null;
      trial = null;
    };
    const submit = (picked) => {
      if (!trial) return;
      let answer;
      if (item) {
        const dontKnow = picked < 0;
        const text = dontKnow ? "No sé" : shown[picked];
        answer = { text, score: dontKnow ? "no_se" : text === right ? "correcta" : "incorrecta", expected: right, options: shown, position: dontKnow ? "" : picked + 1, dontKnow, itemType: item.type };
      } else if (shown) {
        const text = shown[picked];
        answer = { text, score: text === right ? "correcta" : "incorrecta", expected: right, options: shown, position: picked + 1 };
      } else {
        const text = input.value.trim();
        if (!text) return;
        answer = { text, score: SurveyCore.scoreAnswer(text, d.accept, d.near), expected: d.expected, firstKeyMs: firstKey };
      }
      finish({ ...answer, ms: performance.now() - trial.started });
      if (step.practice) {
        if (item) return palabraFeedback(answer.score === "correcta" ? "Correcto." : answer.dontKnow ? `La respuesta era «${right}».` : `Incorrecto: la respuesta era «${right}».`);
        if (!shown) return palabraFeedback(`Respuesta esperada: ${d.expected}.`);
        return palabraFeedback(`${answer.score === "correcta" ? "¡Bien! " : ""}La respuesta es «${right}».`);
      }
      go(session.position + 1);
    };
    // a question has a time limit; when it runs out the next screen says so
    const seconds = item ? block.timeoutSeconds : 0;
    const timeOut = () => {
      if (!trial) return;
      finish({ text: "", score: "tiempo", expected: right, options: shown, position: "", timeout: true, itemType: item.type, ms: seconds * 1000 });
      if (step.practice) return palabraFeedback(`Se acabó el tiempo. La respuesta era «${right}».`);
      session.notice = "Se acabó el tiempo para la pregunta anterior.";
      go(session.position + 1);
    };
    if (input) {
      input.addEventListener("input", () => {
        if (trial && firstKey === null && input.value.trim()) firstKey = performance.now() - trial.started;
        next.disabled = !input.value.trim();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        // otherwise this Enter's keypress also presses the button the next screen focuses
        e.preventDefault();
        submit();
      });
      next.addEventListener("click", () => submit());
    }
    show(
      h("section", { class: "trial" },
        area,
        h("aside", { class: "panel" },
          previewBar(step),
          palabraLabel(step),
          h("h2", {}, item ? item.text : block.prompt),
          item ? null : h("p", { class: "hint" }, block.hint || ""),
          h("p", { class: "hint phone-hint" }, "Toca el diagrama para acercarlo. Con el teléfono horizontal se ve más grande."),
          shown ? h("div", { class: "options" }, choices) : [input, next],
          // the preview also leaves the diagram without an answer
          preview ? h("div", { class: "row" }, backButton(), skipButton()) : null)));
    try {
      await img.decode();
    } catch {
      // a missing image still shows its alt text
    }
    // a reload in the middle of a diagram restarts it, flagged as interrupted
    const interrupted = session.inTrial === step.key;
    session.inTrial = step.key;
    persist();
    requestAnimationFrame(() => {
      trial = { started: performance.now(), interrupted };
      if (input) input.focus();
      for (const choice of choices) choice.disabled = false;
      if (seconds) timer = setTimeout(timeOut, seconds * 1000);
    });
  }

  /** Practice only: the expected answer, before the real diagrams. */
  function palabraFeedback(text) {
    show(
      h("section", { class: "page narrow" },
        h("p", { class: "step-label" }, "Práctica"),
        h("p", { class: "feedback" }, text),
        h("div", { class: "row" },
          h("button", { class: "primary big", id: "continue", onclick: () => go(session.position + 1) }, "Continuar"))));
    document.getElementById("continue").focus();
  }

  function renderRank(step) {
    const q = questions.get(step.question);
    const answer = answerOf(step);
    // for the CSV: the file each card shows, the SVG or its PNG copy
    answer.formats = Object.fromEntries(step.shown.map((image) => [image, imageUrl(image).endsWith(".png") ? "png" : "svg"]));
    const size = q.size || CANVAS;
    const zoom = q.zoom || 1;
    const labels = step.shown.map((_, i) => String.fromCharCode(65 + i));

    const cards = step.shown.map((image, i) => {
      const pill = h("span", { class: "pill" });
      const img = h("img", { src: imageUrl(image), alt: `Diagrama ${labels[i]}`, draggable: "false" });
      const card = h("div", {
        class: "card",
        role: "button",
        tabindex: "0",
        "aria-label": `Diagrama ${labels[i]}`,
        onclick: () => rank(image),
        onkeydown: (e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            // a held key ranks it once, not on every repeat
            if (!e.repeat) rank(image);
          }
        },
      },
        h("div", { class: "card-head" },
          h("span", { class: "label" }, labels[i]),
          pill,
          preview ? h("span", { class: "meta" }, describe(image)) : null,
          h("button", {
            class: "zoom",
            type: "button",
            "aria-label": `Ver el diagrama ${labels[i]} en grande`,
            onclick: (e) => {
              e.stopPropagation();
              openViewer(i);
            },
          }, "🔍 Ampliar")),
        h("div", { class: "frame", style: `aspect-ratio: ${size[0]} / ${size[1]}` }, img, h("span", { class: "missing-note" }, `No se encontró ${imageUrl(image)}`)));
      img.addEventListener("error", () => card.classList.add("missing"));
      return { image, card, pill };
    });

    const grid = h("div", { class: "grid" }, cards.map((c) => c.card));
    const order = h("div", { class: "order", "aria-live": "polite" });
    const reset = h("button", { onclick: () => update({ ranking: [], tie: false }) }, "Reiniciar");
    const tie = q.allowTie
      ? h("button", { "aria-pressed": "false", onclick: () => update({ ranking: [], tie: !answer.tie }) }, "No veo diferencia")
      : null;
    const comment = h("input", {
      class: "comment",
      type: "text",
      maxlength: "500",
      placeholder: "¿Por qué? (opcional)",
      "aria-label": "¿Por qué? (opcional)",
      value: answer.comment,
      oninput: (e) => {
        answer.comment = e.target.value;
        persist();
      },
    });
    const next = nextButton(q, answer, false);

    function update(change) {
      Object.assign(answer, change);
      persist();
      refresh();
    }

    function rank(image) {
      update({ ranking: SurveyCore.toggleRank(answer.tie ? [] : answer.ranking, image, step.shown), tie: false });
    }

    function refresh() {
      for (const c of cards) {
        const r = answer.ranking.indexOf(c.image);
        c.card.classList.toggle("ranked", r >= 0);
        c.card.setAttribute("aria-pressed", String(r >= 0));
        c.pill.textContent = r >= 0 ? `${r + 1}º` : "";
      }
      order.replaceChildren(...(answer.tie
        ? [h("span", {}, "Marcaste que no ves diferencia.")]
        : [
            h("span", {}, "Tu orden:"),
            ...step.shown.map((_, i) => {
              const image = answer.ranking[i];
              const label = image ? labels[step.shown.indexOf(image)] : "–";
              return h("span", { class: image ? "slot filled" : "slot" }, `${i + 1}º ${label}`);
            }),
          ]));
      reset.disabled = !answer.ranking.length && !answer.tie;
      if (tie) tie.setAttribute("aria-pressed", String(answer.tie));
      next.disabled = !preview && !SurveyCore.isAnswered(q, answer);
      if (viewer.open) renderViewer();
    }

    const hint = step.shown.length === 2
      ? "Toca el que elijas. Con 🔍 lo ves en grande."
      : "Tócalos en orden, del mejor al peor. Con 🔍 los ves en grande.";
    show(
      h("section", { class: "page" },
        previewBar(step),
        h("header", { class: "q-head" }, progress(step), h("h2", {}, q.prompt), h("p", { class: "hint" }, hint)),
        grid,
        h("div", { class: "q-foot" }, order, reset, tie, comment, backButton(), next)));
    screen = {
      step, answer, labels, rank, size, zoom, cardImage: 0,
      fit() {
        screen.cardImage = fitGrid(grid, cards.length, size, zoom);
      },
    };
    refresh();
    screen.fit();
    onQuestion = true;
    shownAt = performance.now();
    preloadNext();
  }

  /**
   * On a computer, sizes the cards so all of a question's images are on
   * screen at once, with the number of columns that leaves them largest. A
   * phone gets one column and scrolls, and so does a window too short to
   * show them at a useful size.
   */
  /**
   * Sizes a ranking's cards. On a computer every version goes on screen at
   * once, as large as the window allows, so they can be compared without
   * scrolling; 🔍 shows the labels at ERdoc's own size. Only a window too short
   * for that, like a phone on its side, gets larger cards and scrolls. A phone
   * gets one column. Returns the width each image is drawn at.
   */
  function fitGrid(grid, n, size, zoom) {
    const GAP = 16; // the grid's gap in styles.css
    // a small diagram may be drawn a little larger than captured, not blown up
    const LARGEST = size[0] * 1.25;
    // under this a card is too small to make out the drawing
    const SMALLEST = 160;
    const aspect = size[0] / size[1];
    // column counts that don't leave one card alone under rows of three or more
    const counts = [];
    for (let cols = n; cols >= 1; cols--) if (!(cols >= 3 && n % cols === 1)) counts.push(cols);
    const card = grid.firstElementChild;
    const frame = card.querySelector(".frame");
    const extraW = card.offsetWidth - frame.offsetWidth;
    const extraH = card.offsetHeight - frame.offsetHeight;
    const width = grid.clientWidth;
    const across = (cols) => (width - GAP * (cols - 1)) / cols - extraW;
    // the widest an image can be while its card still fits the window's height
    const tallest = (document.documentElement.clientHeight - extraH - 2 * GAP) * aspect;
    let choice;
    if (window.innerWidth < 720) {
      choice = { cols: 1, image: Math.min(across(1), Math.max(240, tallest), LARGEST) };
    } else {
      const foot = grid.nextElementSibling;
      const top = grid.getBoundingClientRect().top + window.scrollY;
      const height = window.innerHeight - top - foot.offsetHeight - GAP - 16;
      choice = { cols: 1, image: 0 };
      for (const cols of counts) {
        const rows = Math.ceil(n / cols);
        const image = Math.min(across(cols), ((height - GAP * (rows - 1)) / rows - extraH) * aspect, LARGEST);
        if (image > choice.image) choice = { cols, image };
      }
      if (choice.image < SMALLEST) {
        const cols = Math.min(n, 2);
        const image = Math.min(across(cols), tallest, LARGEST);
        if (image > choice.image) choice = { cols, image };
      }
    }
    grid.style.gridTemplateColumns = `repeat(${choice.cols}, ${Math.floor(choice.image + extraW)}px)`;
    return choice.image;
  }


  function preloadNext() {
    const next = session.steps.slice(session.position + 1).find((step) => step.shown);
    preloaded = next ? next.shown.map((image) => Object.assign(new Image(), { src: imageUrl(image) })) : [];
  }

  function renderChoice(step) {
    const q = questions.get(step.question);
    const answer = answerOf(step);
    const options = q.options.map((option) => h("button", { class: "option", type: "button", onclick: () => pick(option) }, option));
    const other = q.other
      ? h("input", {
          class: "other",
          type: "text",
          maxlength: "200",
          placeholder: q.other,
          "aria-label": q.other,
          value: answer.other,
          oninput: (e) => {
            answer.other = e.target.value;
            persist();
            refresh();
          },
        })
      : null;
    const next = nextButton(q, answer, true);

    function pick(option) {
      const chosen = answer.choice.includes(option);
      if (!q.multiple) answer.choice = [option];
      else answer.choice = chosen ? answer.choice.filter((o) => o !== option) : [...answer.choice, option];
      persist();
      refresh();
    }

    function refresh() {
      options.forEach((button, i) => button.setAttribute("aria-pressed", String(answer.choice.includes(q.options[i]))));
      next.disabled = !preview && !SurveyCore.isAnswered(q, answer);
    }

    show(
      h("section", { class: "page narrow" },
        previewBar(step),
        progress(step),
        h("h2", {}, q.prompt),
        h("div", { class: q.multiple ? "options multiple" : "options" }, options, other),
        h("div", { class: "row" }, backButton(), next)));
    refresh();
    onQuestion = true;
    shownAt = performance.now();
  }

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
    const a = h("a", { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function copyButton(text) {
    const button = h("button", {
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(text());
        } catch {
          const area = h("textarea", { class: "offscreen" });
          area.value = text();
          document.body.append(area);
          area.select();
          document.execCommand("copy");
          area.remove();
        }
        button.textContent = "Copiado ✓";
      },
    }, "Copiar al portapapeles");
    return button;
  }

  /** The end: the answers go to the server, or, without one or if it fails, they can be downloaded. */
  function renderThanks(s) {
    const name = `respuestas-${fileSafe(s.participant)}`;
    const status = h("p", { class: "status", "aria-live": "polite" });
    const actions = h("div", { class: "row" });
    const downloads = () => [
      h("button", { class: ENDPOINT ? "" : "primary big", onclick: () => download(`${name}.csv`, SurveyCore.toCSV(SurveyCore.rowsOf(s)), "text/csv") },
        "Descargar respuestas (CSV)"),
      h("button", { onclick: () => download(`${name}.json`, JSON.stringify(s, null, 2), "application/json") }, "Descargar (JSON)"),
      copyButton(() => JSON.stringify(s)),
    ];
    const attempt = async () => {
      status.textContent = "Enviando tus respuestas…";
      actions.replaceChildren();
      try {
        await upload(s);
        status.textContent = "Tus respuestas se enviaron. Ya puedes cerrar esta página.";
      } catch {
        status.textContent = "No se pudieron enviar tus respuestas. Prueba otra vez o, si no resulta, descárgalas y envíalas a quien te invitó.";
        actions.replaceChildren(h("button", { class: "primary big", onclick: attempt }, "Enviar otra vez"), ...downloads());
      }
    };
    show(
      h("section", { class: "page narrow" },
        h("div", { class: "done-mark", "aria-hidden": "true" }, "✓"),
        h("h1", {}, "¡Gracias!"),
        paragraphs(config.thanks),
        status,
        actions,
        h("p", { class: "again" },
          h("button", { class: "link", onclick: () => { session = null; renderWelcome(); } }, "Empezar una encuesta nueva"))));
    if (!ENDPOINT) {
      status.textContent = "Tus respuestas quedaron guardadas en este navegador. Si te lo pidieron, descárgalas y envíalas a quien te invitó.";
      actions.replaceChildren(...downloads());
    } else if (s.sentAt) {
      status.textContent = "Tus respuestas ya se enviaron. Ya puedes cerrar esta página.";
    } else {
      attempt();
    }
  }

  function renderResults() {
    preview = false;
    session = null;
    const done = load("done", []);
    const current = load("current", null);
    const stamp = new Date().toISOString().slice(0, 10);
    const answered = (s) =>
      s.steps.filter((step) =>
        ["palabra", "pregunta", "facilidad"].includes(step.kind) ? !step.practice && Boolean(s.answers[step.key])
          : step.kind === "question" && questions.has(step.question)
            && SurveyCore.isAnswered(questions.get(step.question), s.answers[step.question])).length;
    const minutes = (s) => (s.finishedAt ? ((Date.parse(s.finishedAt) - Date.parse(s.startedAt)) / 60000).toFixed(1) : "–");
    show(
      h("section", { class: "page narrow wide" },
        h("h1", {}, "Respuestas guardadas en este navegador"),
        done.length
          ? h("div", { class: "table-wrap" },
              h("table", {},
                h("thead", {}, h("tr", {}, ["Id", "Inicio", "Minutos", "Respondidas", "Estado", ENDPOINT ? "Enviada" : null, "Pantalla"].filter(Boolean).map((t) => h("th", {}, t)))),
                h("tbody", {}, done.map((s) => h("tr", {},
                  h("td", {}, s.participant),
                  h("td", {}, new Date(s.startedAt).toLocaleString()),
                  h("td", {}, minutes(s)),
                  h("td", {}, `${answered(s)} de ${s.steps.filter(answerable).length}`),
                  h("td", {}, s.finishedAt ? "Terminada" : "Incompleta"),
                  ENDPOINT ? h("td", {}, s.sentAt ? "Sí" : "No") : null,
                  h("td", {}, `${s.device.width}×${s.device.height}${s.device.touch ? " táctil" : ""}`))))))
          : h("p", {}, "Todavía no hay encuestas guardadas en este navegador."),
        current && current.position < (current.steps || []).length
          ? h("p", { class: "muted" }, `Hay una en curso (id ${current.participant}); no se incluye hasta que termine o se descarte.`)
          : null,
        h("div", { class: "row" },
          h("button", {
            class: "primary",
            disabled: !done.length,
            onclick: () => download(`respuestas-${stamp}.csv`, SurveyCore.toCSV(done.flatMap(SurveyCore.rowsOf)), "text/csv"),
          }, "Descargar todo (CSV)"),
          h("button", {
            disabled: !done.length,
            onclick: () => download(`respuestas-${stamp}.json`, JSON.stringify(done, null, 2), "application/json"),
          }, "Descargar todo (JSON)"),
          h("button", {
            class: "danger",
            disabled: !done.length,
            onclick: () => {
              if (!confirm(`¿Borrar las ${done.length} encuestas guardadas en este navegador? Descárgalas antes: esto no se puede deshacer.`)) return;
              store("done", null);
              renderResults();
            },
          }, "Borrar")),
        h("p", { class: "again" }, h("a", { href: home }, "← Volver a la encuesta"))));
  }

  function renderErrors(errors) {
    show(
      h("section", { class: "page narrow" },
        h("h1", {}, "La encuesta no puede empezar"),
        h("p", {}, "Revisa questions.js:"),
        h("ul", { class: "errors" }, errors.map((e) => h("li", {}, e)))));
  }

  // ---------------------------------------------------------------- viewer

  // One image of the question at a time, large. The arrows, the keyboard or
  // a swipe flip to the next while the zoom and scroll stay put, so small
  // differences between the versions jump out.
  const view = { index: 0, zoomed: false };
  let parts = null;
  let dragged = false;

  function buildViewer() {
    const title = h("span", { class: "viewer-title" });
    const status = h("span", { class: "pill" });
    const zoom = h("button", { onclick: () => setZoom(!view.zoomed) });
    const close = h("button", { "aria-label": "Cerrar", title: "Cerrar (Esc)", onclick: closeViewer }, "✕");
    const img = h("img", { alt: "", draggable: "false" });
    const stage = h("div", { class: "viewer-stage" }, img,
      h("p", { class: "viewer-hint" }, "Toca la imagen para acercarla. Con el teléfono horizontal se ve más grande."));
    const prev = h("button", { "aria-label": "Diagrama anterior", onclick: () => flip(-1) });
    const choose = h("button", { class: "primary", onclick: () => screen.rank(screen.step.shown[view.index]) });
    const next = h("button", { "aria-label": "Diagrama siguiente", onclick: () => flip(1) });
    viewer.append(
      h("div", { class: "viewer-bar" }, title, status, h("span", { class: "spacer" }), zoom, close),
      stage,
      h("div", { class: "viewer-bar bottom" }, prev, choose, next));
    parts = { title, status, zoom, img, stage, prev, choose, next };

    img.addEventListener("click", (e) => {
      if (dragged) return;
      const box = img.getBoundingClientRect();
      setZoom(!view.zoomed, { x: (e.clientX - box.left) / box.width, y: (e.clientY - box.top) / box.height });
    });
    viewer.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        flip(e.key === "ArrowLeft" ? -1 : 1);
      }
    });
    viewer.addEventListener("close", () => {
      document.body.classList.remove("viewing");
      view.zoomed = false;
      img.style.width = "";
      viewer.classList.remove("zoomed");
      if (screen) screen.fit();
    });

    // a mouse drags a zoomed image around; a sideways swipe on a fitted one flips
    let start = null;
    stage.addEventListener("pointerdown", (e) => {
      dragged = false;
      start = { x: e.clientX, y: e.clientY, left: stage.scrollLeft, top: stage.scrollTop };
    });
    stage.addEventListener("pointermove", (e) => {
      if (!start || e.pointerType !== "mouse" || !view.zoomed || !(e.buttons & 1)) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      stage.scrollLeft = start.left - dx;
      stage.scrollTop = start.top - dy;
    });
    stage.addEventListener("pointerup", (e) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      if (!view.zoomed && e.pointerType !== "mouse" && Math.abs(dx) > 50 && Math.abs(dx) > 2 * Math.abs(dy)) {
        flip(dx < 0 ? 1 : -1);
      }
      start = null;
    });
    stage.addEventListener("pointercancel", () => {
      start = null;
    });
  }

  function openViewer(index) {
    view.index = index;
    view.zoomed = false;
    document.body.classList.add("viewing");
    viewer.showModal();
    renderViewer();
    parts.stage.scrollTop = 0;
    // where the screen can't show it larger than the card and the card's labels are smaller than
    // ERdoc's own, «Ampliar» goes straight to ERdoc's own size
    const cardLabel = (16 * screen.zoom * screen.cardImage) / screen.size[0];
    if (viewerWidths().fit < screen.cardImage * 1.15 && cardLabel < 16) setZoom(true);
    countView();
  }

  /**
   * The enlarged image's widths. Fitted: the screen, but never smaller than the
   * card nor far beyond ERdoc's own size. «Acercar»: ERdoc's own size (labels
   * at 16 px), or half again the fitted one if that is already larger.
   */
  function viewerWidths() {
    const [w, h] = screen.size;
    const own = w / screen.zoom;
    const contain = Math.min(parts.stage.clientWidth, parts.stage.clientHeight * (w / h));
    const fit = Math.max(Math.min(contain, own * 1.5), screen.cardImage);
    return { fit, close: Math.max(own, fit * 1.5) };
  }

  function closeViewer() {
    if (viewer.open) viewer.close();
  }

  function flip(delta) {
    const n = screen.step.shown.length;
    view.index = (view.index + delta + n) % n;
    renderViewer();
    countView();
  }

  function countView() {
    const image = screen.step.shown[view.index];
    const opens = screen.answer.zoomOpens;
    opens[image] = (opens[image] || 0) + 1;
    persist();
  }

  function renderViewer() {
    if (!screen) return;
    const { step, answer, labels } = screen;
    const n = step.shown.length;
    const image = step.shown[view.index];
    const r = answer.ranking.indexOf(image);
    parts.img.src = imageUrl(image);
    parts.img.alt = `Diagrama ${labels[view.index]}`;
    parts.title.textContent = `Diagrama ${labels[view.index]} (${view.index + 1} de ${n})${preview ? ` · ${describe(image)}` : ""}`;
    parts.status.textContent = r >= 0 ? `${r + 1}º` : "";
    parts.zoom.textContent = view.zoomed ? "Ajustar" : "Acercar";
    parts.prev.textContent = `‹ ${labels[(view.index - 1 + n) % n]}`;
    parts.next.textContent = `${labels[(view.index + 1) % n]} ›`;
    parts.choose.textContent = r >= 0 ? `Quitar del ${r + 1}º lugar` : `Elegir como ${answer.tie ? 1 : answer.ranking.length + 1}º`;
    viewer.classList.toggle("zoomed", view.zoomed);
    const widths = viewerWidths();
    parts.img.style.width = `${Math.round(view.zoomed ? widths.close : widths.fit)}px`;
  }

  /** Zooms to twice the fitted size, keeping `focus` (fractions of the image) in the middle. */
  function setZoom(on, focus = { x: 0.5, y: 0.5 }) {
    const { img, stage } = parts;
    view.zoomed = on;
    renderViewer();
    if (on) {
      stage.scrollLeft = focus.x * img.offsetWidth - stage.clientWidth / 2;
      stage.scrollTop = focus.y * img.offsetHeight - stage.clientHeight / 2;
    }
  }

  // ------------------------------------------------------------------ boot

  const errors = SurveyCore.validate(config);
  if (errors.length) {
    renderErrors(errors);
    return;
  }
  document.title = config.title;
  blocks = new Map(config.blocks.map((b) => [b.id, b]));
  questions = new Map(config.blocks.flatMap((b) => questionsOf(b)).map((q) => [q.id, q]));
  buildViewer();

  let resizing = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizing);
    resizing = requestAnimationFrame(() => {
      if (!screen) return;
      screen.fit();
      if (viewer.open) renderViewer();
    });
  });
  // time spent with the tab hidden doesn't count
  document.addEventListener("visibilitychange", () => {
    // time with the tab hidden can't be told apart from reading: flag the diagram
    if (document.visibilityState === "hidden" && trial) trial.interrupted = true;
    if (!onQuestion) return;
    if (document.visibilityState === "hidden") {
      if (shownAt) answerOf(session.steps[session.position]).ms += performance.now() - shownAt;
      shownAt = 0;
      persist();
    } else if (!shownAt) {
      shownAt = performance.now();
    }
  });
  // a held Enter acts once: its repeats would press whatever button the first press brought into focus,
  // like «Ver diagrama» after an answer or «Acercar» after 🔍
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.repeat) e.preventDefault();
  }, true);
  window.addEventListener("hashchange", route);
  route();
})(typeof window !== "undefined" ? window : globalThis);
