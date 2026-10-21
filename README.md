# Diagram survey

One survey in two parts, as a static page with no build step, plus a small server that receives the answers:

0. **Two questions about the person** (block `perfil`): whether they have taken Bases de Datos (CC3102) and whether they know what an ER diagram is.
1. **Rankings**: 10 questions. Each shows every version of one of your screenshot diagrams, ranked from favourite to least favourite.
2. **«¿Qué representa?»**: 8 other ER diagrams, one at a time. Each person sees each diagram once, 4 in the old layout and 4 in the new, at random, and picks what it represents from three options. The time is measured. There is a practice diagram first.

The parts follow the order of `blocks` in `questions.js`. To put the one-word part first, swap the two blocks, their «Parte N de 2» titles and the order in `welcome`, and change `id`.

## Running it

- **With the server:** `node server.js` (Node 18 or later, nothing to install) serves it at http://localhost:3000 and collects the answers; see *Collecting answers*.
- **Without it:** open `index.html`. From Windows it is at `\\wsl.localhost\Ubuntu\home\cris\encuesta-diagramas\index.html`. It works offline (the font is in `fonts/`, so keep that folder with the rest), and the answers stay in that browser.
- **On phones:** put the server online and share its URL. On a phone, part 2's diagrams are small at first: a tap on the diagram shows it at ERdoc's own size around that point (and the page says so), and the phone on its side shows it larger.
- **Before a session:** check every screen at `index.html#preview` on each kind of device people will use. Nothing is saved there, and each screen says which version it shows. Add `=N` to jump to ranking N, e.g. `#preview=5`, or a block's id to start there: `#preview=perfil`, `#preview=palabra`.
- **Image format:** Chrome (and Edge and the other Chromium browsers) and Firefox show the ranking images as SVGs, which stay sharp when enlarged. Safari, every browser on an iPhone or iPad, and any browser the page doesn't recognise get the PNG copies instead, because WebKit draws these SVGs at the wrong size. Add `?png` or `?svg` before the `#` to force one, e.g. `index.html?png#preview=5`. «Salir» and the end of the preview drop it.

## Collecting answers

With the server, participants send nothing by hand:

- `node server.js` keeps every answer in `datos/<survey id>/<id>.json`. `PORT=8080 node server.js` uses another port; `DATOS=/some/folder` another folder.
- **The researcher's page**, `/admin?clave=…`, counts the finished surveys, lists them and downloads them all as one CSV or JSON. Its key is printed when the server starts. Set your own with `SURVEY_KEY=…`; otherwise it is kept in `datos/clave.txt`.
- Participants get no code. Each answer carries a random id, only to tell answers apart; sending the same id again replaces the earlier copy.
- If sending fails, the thanks page offers to try again and to download the answers, and that browser also retries quietly the next time it opens the survey.
- **Putting it online:** any host that runs Node (Render, Railway, Fly.io, a university server) with a disk that keeps `datos/`; or run it on your own computer and open a tunnel to it for the session (e.g. `cloudflared tunnel --url http://localhost:3000`). The page itself can also live on a static host (GitHub Pages) with `endpoint: "https://your-server/api/respuestas"` in `questions.js`; the server accepts answers from any site.

Without the server (opened as a file): each participant can download their answers at the end, and a shared lab machine keeps every finished session in that browser: `index.html#resultados` downloads them all as one file, then *Borrar*. Clearing the browser's data deletes them, so download after each batch.

## Editing `questions.js`

- **Part 2** is the block with `type: "palabra"`.
  - Each diagram has `images.old` and `images.new` (ERdoc screenshots cropped to the drawing, both at the same zoom and the same crop), `size` and `zoom` (written by the retake tool: the crop in CSS px and the ERdoc zoom, which a phone's tap-to-zoom uses) and `options`: the three answers to choose from, **the right one first**. Each person sees them in a random order, and a tap on one answers.
  - Without `options`, people type the answer instead. It is then scored against `accept` (answers that count as right) and `near` (the other place its names also fit), and `expected` is the answer shown after the practice.
  - The diagrams' ERdoc code is in `diagramas/palabra/`. With ERdoc running, `node ~/test-legibilidad/herramientas/capturar-palabra.js ~/encuesta-diagramas ~/encuesta-diagramas/diagramas/palabra` retakes every diagram in both layouts and updates `size` and `zoom`.
- **Choice question** (the `perfil` block): `{ id, prompt, options: [...] }`, with `multiple: true` to allow several answers and `other: "placeholder"` for a free-text option. The chosen option goes to the CSV as written.
- **Rank question:** `{ id, size, zoom, prompt, images: [...] }`, with any number of images (2 or more). `size` is the [width, height] every screenshot of that question is cropped to, and `zoom` is the ERdoc zoom they were taken at. The cards take that shape, and the zoom tells the app how large the labels end up on screen. The retake tool writes both.
- **Blocks:**
  - A block's `prompt`, `type` and `allowTie` are defaults for its questions.
  - `shuffle: true` shuffles the block's questions for each participant.
  - `intro` shows a screen before the block.
  - The back button only works within a block.
- **Checks:** the page won't start, and lists the problems instead, if:
  - a ranking mixes diagrams or attribute groups, repeats an image, or names an image that isn't in `images`;
  - a part 2 diagram lacks an image, has fewer than two options or repeats one (or, without options, has no accepted answers).
- **Change `id` whenever the questions change.** It seeds the random orders (the same id always gets the same order) and keys the stored data.
- **Adding a ranking screenshot:** copy it into `img/` under any name and add a line to `images`, e.g. `"fig1_no-attributes_edge-connection_new-algorithm": "img/x.svg"`. The name must follow that pattern; the app reads the version from it. An SVG needs a PNG copy with the same name beside it (`img/x.png`) for the browsers that get PNGs; the retake tool writes both. A PNG on its own also works.
- fig1, fig3 and fig4 without attributes have no «edge connection, new algorithm» version on purpose: it looks exactly like another version.
- **Retaking the ranking screenshots:** the ERdoc code of fig1–fig5 is in `diagramas/`. With ERdoc running, `node ~/test-legibilidad/herramientas/capturar-rankings.js ~/encuesta-diagramas ~/encuesta-diagramas/diagramas` retakes every version, as an SVG and a PNG, and updates `size` and `zoom`. It lays each diagram out with the attributes shown and, for a version without attributes, then unticks «Mostrar atributos», as when they're made by hand. Every version of a question gets the same zoom and the same crop.

Versions in the rankings: *edge* = `edgeAnchor: "side"` (the default) and *center* = `"centre"`. The *old* algorithm is *Dirigido por fuerzas*; the *new* one is *Colocación alineada*.

## Screens

On a computer, part 1 shows every version of a question at once, as large as the window allows, so they can be compared without scrolling. Only phones scroll.

- On a full-HD screen (1920×1080), the small diagrams' labels read at 10 px or more, but the big ones (fig3–fig5 with attributes, fig5 without) come out at 5–9 px.
- On a small laptop (1366×768), those go down to 4–6 px.
- «🔍 Ampliar» shows one version large, up to ERdoc's own size (16 px), and flips between the versions.

For lab sessions, use full-HD screens or larger.

## Data

One CSV holds everything. The `type` column says what a row is: `choice` (the two questions about the person, with the answer in `choice`), `rank` or `palabra`.

**Part 1** (`type` = `rank`): one row per image per ranking.

| Column | Meaning |
|---|---|
| `shown_pos` | The image's place on screen (A = 1). |
| `rank` | 1 = favourite. |
| `ms` | Time spent with the question on screen. |
| `zoom_opens` | How many times that image was shown enlarged. |
| `image_format` | The file that card showed: `svg`, or `png` on Safari, iPhones, iPads and browsers the page doesn't recognise (and with `?png`). |

**Part 2** (`type` = `palabra`): one row per diagram.

| Column | Meaning |
|---|---|
| `question` | The diagram. |
| `layout` | `old` or `new`. |
| `answer` | The option the person chose. |
| `score` | `correcta` or `incorrecta`. |
| `expected` | The right option. |
| `options` | The three options in the order that person saw them, top first. |
| `shown_pos` | The place of the chosen option (1 = top). |
| `ms` | Time from the diagram appearing (after «Ver diagrama») to the answer. |
| `zoom_opens` | How many times the person tapped the diagram to see it at ERdoc's own size (mostly phones). |
| `practice` | 1 for the practice diagram, which isn't analysed. |
| `interrupted` | 1 if the tab was hidden or the page reloaded during that diagram. Leave those out. |

In both parts, `seq` is the order within that person's survey, and `screen` and `touch` describe the device.

## Analysis

- **Profile:** the `choice` rows let you split the results by whether people took the course or know ER diagrams.
- **Part 1:** the question isn't "old app or new app" but one answer per setting.
  1. For each participant and rank question, take every pair of images that differ only in the setting being judged. The *new* level wins the pair when its `rank` is lower.
  2. Per participant, compute the share of pairs the new level wins.
  3. Test those shares against 50% (sign test or Wilcoxon), overall and by attribute group.
- **Part 2:**
  - Compare `ms` between `old` and `new` on correct answers, per person, since each person saw both.
  - Compare the share of `correcta` the same way. `answer` shows which wrong option was picked.

All screenshots are ERdoc canvas captures with no grid or controls. Every version shown in the same part 1 question or part 2 diagram is at the same zoom, so text size never differs between the versions being compared.
