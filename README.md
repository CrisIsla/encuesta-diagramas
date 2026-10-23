# Encuesta de diagramas

A survey about ERdoc's diagrams, in two steps:

1. **Three questions about the person**: whether they took Bases de Datos (CC3201), whether they know what an ER diagram is and whether they know ERdoc Playground.
2. **Pairs**: 10 questions, from the simplest diagram to the most complex, each with two versions of one diagram side by side, to tap the one they like more. The two differ in one setting only: 9 pairs compare the old and the new layout, both with lines to the centre and without attributes (fig1, fig3, fig4, fig5, supervision, universidad, torneo, metro and editorial) and 1 compares lines to the edge against lines to the centre on the old layout: fig2's Empleado–Maneja, the only pair with attributes, where the recursive relationship makes the difference show.

Two more parts, «¿Qué representa?» and «Preguntas sobre el diagrama», were taken out, and the pairs replaced the rankings. The app still runs all three: their blocks are in `questions.js` at commit 54779ea (`git show 54779ea:questions.js`), with that README's notes on them, and the two parts' screenshots and `.erdoc` sources are still in `img/` and `diagramas/`. The CSV keeps their columns, empty.

## Running it

```
npm start
```

That serves the survey at http://localhost:3000 and saves every finished answer in `datos/`. The terminal also prints the researcher's page, `/admin?clave=…`, which counts the answers and downloads them all as one CSV or JSON. `PORT=8080 npm start` changes the port; `SURVEY_KEY=…` sets the key.

`#preview` walks through every screen without saving anything and names each version; `#preview=5` jumps to pair 5 and `#preview=layout-fig3` to that question. `npm run dev` is for looking the survey over: its «Comenzar» goes to the preview, and its first page links to every question, to open them in any order.

Opened as a file instead of through the server, the answers stay in the browser and can be downloaded at the end.

## The data

One CSV, with one row per thing answered. `type` says what the row is:

- `choice`: the questions about the person, with the answer in `choice`.
- `rank`: one row per image of a pair. `fig`, `attributes`, `connection` and `algorithm` say which version it is; `shown_pos` is its place on screen (A = left), `rank` is 1 for the one picked and 2 for the other, `ms` the time on that question and `zoom_opens` how often it was enlarged.

`participant` is a random id, `seq` the order within that person's survey, and `screen` and `touch` describe the device.

**Analysis.** The pairs give one answer per setting, not one old-versus-new verdict: each pair differs in one setting, and the new level (new layout, or lines to the centre) wins it when its `rank` is 1. Per person, compute the share of pairs the new level wins, for the layout pairs and for the connection pairs separately, and test it against 50 % (sign test or Wilcoxon). For «¿Qué representa?» and the questions, compare `ms` on correct answers and the share of `correcta` between `old` and `new`, per person, since everyone saw both; the ratings compare the same way.

## Editing the questions

Everything is in `questions.js`. Change its `id` whenever the questions change; it seeds the random orders.

- Questions about the person: `{ id, prompt, options }`.
- Pairs: `{ id, erdoc, size, zoom, images: [a, b] }`. The image names say the version, e.g. `fig1_no-attributes_edge-connection_old-algorithm`, and `erdoc` the diagram's source in `diagramas/` (`fig1`, or `pares/universidad`; fig6–fig10 are universidad, torneo, metro, editorial and supervision). A `hint` replaces the line under the question.

The screenshots come from ERdoc (`npm run dev` in `~/er`), with the tools in `~/test-legibilidad/herramientas`:

```
node ~/test-legibilidad/herramientas/capturar-pares.js ~/encuesta-diagramas ~/encuesta-diagramas/diagramas
```

They write the images and each question's `size` and `zoom`. Within a question, every version has the same zoom and crop, so text size never differs between the versions being compared. If port 4000 is busy, run ERdoc on another and set `ERDOC=http://localhost:4100/es`. Safari gets PNG copies of the pair images, because it draws the SVGs wrong; `?png` or `?svg` in the address forces one.
