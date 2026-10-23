// The survey: its texts, the screenshots and the questions.
//
// Three questions about the person first ("perfil"), then the pairs of
// screenshots below, in the order of `blocks`.
//
// Questions name screenshots by their original file name,
//   fig<N>_<with|no>-attributes_<center|edge>-connection_<old|new>-algorithm
// (a tag at the end, like _detalle, tells apart a second capture of the same
// version with its own crop) and `images` maps each name to its file in img/: an SVG of ERdoc's own drawing,
// with a PNG of the same picture beside it, which Safari, iPhones, iPads and
// browsers the app doesn't recognise are shown instead (?png or ?svg in the
// address forces one). The files have meaningless
// names so a participant who opens one on its own can't read the version from
// the address. The app checks every question when it loads: at least two
// images, none twice, and all of the same diagram and attribute group.
//
// A ranking's `size` is the [width, height] its screenshots are cropped to and
// `zoom` the ERdoc zoom they were taken at (all of a question's versions share
// both). The cards take that shape; the zoom tells how large labels end up.
// A block's `prompt`, `type` and `allowTie` are defaults for its questions.
// Change `id` whenever the questions change: it seeds the random orders and
// keys what the browser stores. `endpoint` is where the answers are sent; left
// out, they go to the server the page came from (server.js).
window.SURVEY = {
  id: "encuesta-2026-10-23",
  title: "Encuesta de diagramas",

  welcome: `Primero responderás tres preguntas sobre ti. Después elegirás, entre dos versiones de un mismo diagrama entidad-relación, la que más te gusta.

Toma unos 5 minutos.`,

  thanks: `Eso es todo. ¡Muchas gracias por tu tiempo!`,

  images: {
    "fig1_no-attributes_center-connection_old-algorithm": "img/097bc4.svg",
    "fig1_no-attributes_center-connection_new-algorithm": "img/f852ac.svg",
    "fig3_no-attributes_center-connection_old-algorithm": "img/a30825.svg",
    "fig3_no-attributes_center-connection_new-algorithm": "img/d63508.svg",
    "fig4_no-attributes_center-connection_old-algorithm": "img/37fd42.svg",
    "fig4_no-attributes_center-connection_new-algorithm": "img/0ee4c2.svg",
    "fig5_no-attributes_center-connection_old-algorithm": "img/a28e38.svg",
    "fig5_no-attributes_center-connection_new-algorithm": "img/f9a663.svg",
    "fig6_no-attributes_center-connection_old-algorithm": "img/f720bb.svg",
    "fig6_no-attributes_center-connection_new-algorithm": "img/b2e17b.svg",
    "fig7_no-attributes_center-connection_old-algorithm": "img/5c7658.svg",
    "fig7_no-attributes_center-connection_new-algorithm": "img/c864b6.svg",
    "fig8_no-attributes_center-connection_old-algorithm": "img/bf07ad.svg",
    "fig8_no-attributes_center-connection_new-algorithm": "img/6eb443.svg",
    "fig9_no-attributes_center-connection_old-algorithm": "img/04ac55.svg",
    "fig9_no-attributes_center-connection_new-algorithm": "img/d9400e.svg",
    "fig2_with-attributes_edge-connection_old-algorithm": "img/36b290.svg",
    "fig2_with-attributes_center-connection_old-algorithm": "img/cf7c4e.svg",
    "fig10_no-attributes_center-connection_old-algorithm": "img/2a66f5.svg",
    "fig10_no-attributes_center-connection_new-algorithm": "img/a22424.svg",
  },

  blocks: [
    {
      // Who is answering. Each question shows its options as buttons; the
      // chosen one goes to the CSV as it is written here.
      id: "perfil",
      type: "choice",
      questions: [
        { id: "perfil-curso", prompt: "¿Has cursado el curso Bases de Datos (CC3201)?", options: ["Sí", "No", "Lo estoy cursando"] },
        { id: "perfil-er", prompt: "¿Sabes lo que es un diagrama entidad-relación?", options: ["Sí", "Más o menos", "No"] },
        { id: "perfil-erdoc", prompt: "¿Conoces el sistema ERdoc Playground?", options: ["Lo conozco y lo he usado", "Lo conozco, pero no lo he usado", "No lo conozco"] },
      ],
    },
    {
      // Part 1: pairs, from the simplest diagram to the most complex, each
      // diagram once. Each question shows two versions of one diagram that
      // differ in one setting only: the layout algorithm (old or new, with the
      // lines to the centre), or where the lines meet the shapes (edge or
      // centre, on the old layout: fig2's pair, the only one with attributes). fig1–fig5 are the diagrams in diagramas/;
      // fig6–fig10 are the ones in diagramas/pares/ (universidad, torneo,
      // metro, editorial, supervision), as `erdoc` says. The retake tool
      // writes each question's `size` and `zoom`.
      id: "pares",
      intro: {
        title: "¿Cuál te gusta más?",
        text: `Verás dos versiones de un mismo diagrama, una al lado de la otra. Las dos muestran el mismo modelo; solo cambia cómo está dibujado.

Toca la que más te guste. Con 🔍 puedes verlas en grande y pasar de una a otra para notar las diferencias. Aquí no hay respuestas correctas: nos interesa tu opinión.`,
      },
      prompt: "¿Cuál de los dos te gusta más?",
      questions: [
        { id: "layout-fig1", erdoc: "fig1", size: [869, 700], zoom: 2, images: [
          "fig1_no-attributes_center-connection_old-algorithm",
          "fig1_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "conexion-fig2", erdoc: "fig2", size: [886, 460], zoom: 2, hint: "Es el mismo diagrama: fíjate en cómo llegan las líneas a las figuras.", images: [
          "fig2_with-attributes_edge-connection_old-algorithm",
          "fig2_with-attributes_center-connection_old-algorithm",
        ] },
        { id: "layout-fig3", erdoc: "fig3", size: [894, 886], zoom: 1.2404, images: [
          "fig3_no-attributes_center-connection_old-algorithm",
          "fig3_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "layout-supervision", erdoc: "pares/supervision", size: [1380, 764], zoom: 1.2648, images: [
          "fig10_no-attributes_center-connection_old-algorithm",
          "fig10_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "layout-fig4", erdoc: "fig4", size: [764, 886], zoom: 0.8376, images: [
          "fig4_no-attributes_center-connection_old-algorithm",
          "fig4_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "layout-metro", erdoc: "pares/metro", size: [1136, 886], zoom: 0.9009, images: [
          "fig8_no-attributes_center-connection_old-algorithm",
          "fig8_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "layout-fig5", erdoc: "fig5", size: [872, 886], zoom: 0.6769, images: [
          "fig5_no-attributes_center-connection_old-algorithm",
          "fig5_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "layout-torneo", erdoc: "pares/torneo", size: [940, 886], zoom: 0.7083, images: [
          "fig7_no-attributes_center-connection_old-algorithm",
          "fig7_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "layout-editorial", erdoc: "pares/editorial", size: [1155, 886], zoom: 0.8991, images: [
          "fig9_no-attributes_center-connection_old-algorithm",
          "fig9_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "layout-universidad", erdoc: "pares/universidad", size: [1380, 682], zoom: 0.8381, images: [
          "fig6_no-attributes_center-connection_old-algorithm",
          "fig6_no-attributes_center-connection_new-algorithm",
        ] },
      ],
    },
  ],
};
