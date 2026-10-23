# Encuesta de diagramas

A survey about ERdoc's diagrams, in two steps:

1. **Three questions about the person**: whether they took Bases de Datos (CC3201), whether they know what an ER diagram is and whether they know ERdoc Playground.
2. **Rankings**: 10 questions. Each shows the versions of one diagram (old or new layout, lines to the edge or the centre, with or without attributes), to order from favourite to least favourite.

Two more parts, «¿Qué representa?» and «Preguntas sobre el diagrama», were taken out. The app still runs them: their blocks are in `questions.js` at commit 54779ea (`git show 54779ea:questions.js`), with this README's notes on them, and their screenshots and `.erdoc` sources are still in `img/` and `diagramas/`. The CSV keeps their columns, empty.

## Running it

```
npm start
```

That serves the survey at http://localhost:3000 and saves every finished answer in `datos/`. The terminal also prints the researcher's page, `/admin?clave=…`, which counts the answers and downloads them all as one CSV or JSON. `PORT=8080 npm start` changes the port; `SURVEY_KEY=…` sets the key.

`#preview` walks through every screen without saving anything and names each version; `#preview=5` jumps to ranking 5 and `#preview=general-fig3-no` to that question. `npm run dev` is for looking the survey over: its «Comenzar» goes to the preview, and its first page links to every question, to open them in any order.

Opened as a file instead of through the server, the answers stay in the browser and can be downloaded at the end.

## The data

One CSV, with one row per thing answered. `type` says what the row is:

- `choice`: the questions about the person, with the answer in `choice`.
- `rank`: one row per image of a ranking. `fig`, `attributes`, `connection` and `algorithm` say which version it is; `shown_pos` is its place on screen (A = 1), `rank` its place in the answer (1 = favourite), `ms` the time on that question and `zoom_opens` how often it was enlarged.

`participant` is a random id, `seq` the order within that person's survey, and `screen` and `touch` describe the device.

**Analysis.** The rankings give one answer per setting, not one old-versus-new verdict: for each setting, take the pairs of images that differ only in it; the new level wins a pair when its `rank` is lower. Per person, compute the share of pairs the new level wins and test it against 50 % (sign test or Wilcoxon).

## Editing the questions

Everything is in `questions.js`. Change its `id` whenever the questions change; it seeds the random orders.

- Questions about the person: `{ id, prompt, options }`.
- Rankings: `{ id, size, zoom, images }`. The image names say the version, e.g. `fig1_with-attributes_edge-connection_old-algorithm`. fig1, fig3 and fig4 without attributes have no «edge, new» version on purpose: it looks the same as another one.

The screenshots come from ERdoc (`npm run dev` in `~/er`), with the tools in `~/test-legibilidad/herramientas`:

```
node ~/test-legibilidad/herramientas/capturar-rankings.js ~/encuesta-diagramas ~/encuesta-diagramas/diagramas
```

They write the images and each question's `size` and `zoom`. Within a question, every version has the same zoom and crop, so text size never differs between the versions being compared. Safari gets PNG copies of the ranking images, because it draws the SVGs wrong; `?png` or `?svg` in the address forces one.
