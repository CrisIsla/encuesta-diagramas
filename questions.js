// The survey: its texts, the screenshots and the questions.
//
// Three questions about the person first ("perfil"), then the rankings of the
// screenshots below, in the order of `blocks`.
//
// Questions name screenshots by their original file name,
//   fig<N>_<with|no>-attributes_<center|edge>-connection_<old|new>-algorithm
// and `images` maps each name to its file in img/: an SVG of ERdoc's own drawing,
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
  id: "encuesta-2026-10-22b",
  title: "Encuesta de diagramas",

  welcome: `Primero responderás tres preguntas sobre ti. Después ordenarás varias versiones de un mismo diagrama entidad-relación según cuál te gusta más.

Toma unos 5 minutos.`,

  thanks: `Eso es todo. ¡Muchas gracias por tu tiempo!`,

  images: {
    "fig1_no-attributes_center-connection_new-algorithm": "img/393jsz.svg",
    "fig1_no-attributes_center-connection_old-algorithm": "img/pp2u57.svg",
    "fig1_no-attributes_edge-connection_old-algorithm": "img/kfryvw.svg",
    "fig1_with-attributes_center-connection_new-algorithm": "img/nzs9ku.svg",
    "fig1_with-attributes_center-connection_old-algorithm": "img/7ryh5g.svg",
    "fig1_with-attributes_edge-connection_new-algorithm": "img/are6ve.svg",
    "fig1_with-attributes_edge-connection_old-algorithm": "img/he7va6.svg",
    "fig2_no-attributes_center-connection_new-algorithm": "img/ef9weh.svg",
    "fig2_no-attributes_center-connection_old-algorithm": "img/4dn5qd.svg",
    "fig2_no-attributes_edge-connection_new-algorithm": "img/e8f9f7.svg",
    "fig2_no-attributes_edge-connection_old-algorithm": "img/bz8xc2.svg",
    "fig2_with-attributes_center-connection_new-algorithm": "img/a3v5sr.svg",
    "fig2_with-attributes_center-connection_old-algorithm": "img/mdfu47.svg",
    "fig2_with-attributes_edge-connection_new-algorithm": "img/7c8m8d.svg",
    "fig2_with-attributes_edge-connection_old-algorithm": "img/evntzg.svg",
    "fig3_no-attributes_center-connection_new-algorithm": "img/nvr52c.svg",
    "fig3_no-attributes_center-connection_old-algorithm": "img/x8jrv9.svg",
    "fig3_no-attributes_edge-connection_old-algorithm": "img/76wypx.svg",
    "fig3_with-attributes_center-connection_new-algorithm": "img/saqgqk.svg",
    "fig3_with-attributes_center-connection_old-algorithm": "img/dskyqu.svg",
    "fig3_with-attributes_edge-connection_new-algorithm": "img/zw7t3c.svg",
    "fig3_with-attributes_edge-connection_old-algorithm": "img/gbp6xn.svg",
    "fig4_no-attributes_center-connection_new-algorithm": "img/c8h3tm.svg",
    "fig4_no-attributes_center-connection_old-algorithm": "img/ue4g5v.svg",
    "fig4_no-attributes_edge-connection_old-algorithm": "img/f27tq5.svg",
    "fig4_with-attributes_center-connection_new-algorithm": "img/ym6f3f.svg",
    "fig4_with-attributes_center-connection_old-algorithm": "img/bap8hw.svg",
    "fig4_with-attributes_edge-connection_new-algorithm": "img/ufhjng.svg",
    "fig4_with-attributes_edge-connection_old-algorithm": "img/amx6z9.svg",
    "fig5_no-attributes_center-connection_new-algorithm": "img/m944vq.svg",
    "fig5_no-attributes_center-connection_old-algorithm": "img/j9nfug.svg",
    "fig5_no-attributes_edge-connection_new-algorithm": "img/gg48ww.svg",
    "fig5_no-attributes_edge-connection_old-algorithm": "img/rkm8nb.svg",
    "fig5_with-attributes_center-connection_new-algorithm": "img/pytpzx.svg",
    "fig5_with-attributes_center-connection_old-algorithm": "img/naxagq.svg",
    "fig5_with-attributes_edge-connection_new-algorithm": "img/q9a7ac.svg",
    "fig5_with-attributes_edge-connection_old-algorithm": "img/zxd55w.svg",
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
      // Overall preference. Each question shows every version that exists of
      // one diagram with or without attributes.
      id: "general",
      shuffle: true,
      intro: {
        title: "¿Cuál te gusta más?",
        text: `Verás varias versiones de un mismo diagrama. Todas muestran el mismo modelo; solo cambia cómo está dibujado.

Tócalas en orden, empezando por la que más te gusta. Con 🔍 puedes verlas en grande y pasar de una a otra para notar las diferencias. Aquí no hay respuestas correctas: nos interesa tu opinión.`,
      },
      prompt: "Ordena los diagramas del que más te gusta al que menos.",
      questions: [
        { id: "general-fig1-with", size: [932, 886], zoom: 1.725, images: [
          "fig1_with-attributes_edge-connection_old-algorithm",
          "fig1_with-attributes_edge-connection_new-algorithm",
          "fig1_with-attributes_center-connection_old-algorithm",
          "fig1_with-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig1-no", size: [869, 700], zoom: 2, images: [
          "fig1_no-attributes_edge-connection_old-algorithm",
          "fig1_no-attributes_center-connection_old-algorithm",
          "fig1_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig2-with", size: [982, 460], zoom: 2, images: [
          "fig2_with-attributes_edge-connection_old-algorithm",
          "fig2_with-attributes_edge-connection_new-algorithm",
          "fig2_with-attributes_center-connection_old-algorithm",
          "fig2_with-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig2-no", size: [793, 317], zoom: 2, images: [
          "fig2_no-attributes_edge-connection_old-algorithm",
          "fig2_no-attributes_edge-connection_new-algorithm",
          "fig2_no-attributes_center-connection_old-algorithm",
          "fig2_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig3-with", size: [884, 886], zoom: 1.0834, images: [
          "fig3_with-attributes_edge-connection_old-algorithm",
          "fig3_with-attributes_edge-connection_new-algorithm",
          "fig3_with-attributes_center-connection_old-algorithm",
          "fig3_with-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig3-no", size: [894, 886], zoom: 1.2404, images: [
          "fig3_no-attributes_edge-connection_old-algorithm",
          "fig3_no-attributes_center-connection_old-algorithm",
          "fig3_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig4-with", size: [842, 886], zoom: 0.8376, images: [
          "fig4_with-attributes_edge-connection_old-algorithm",
          "fig4_with-attributes_edge-connection_new-algorithm",
          "fig4_with-attributes_center-connection_old-algorithm",
          "fig4_with-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig4-no", size: [764, 886], zoom: 0.8376, images: [
          "fig4_no-attributes_edge-connection_old-algorithm",
          "fig4_no-attributes_center-connection_old-algorithm",
          "fig4_no-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig5-with", size: [818, 886], zoom: 0.6255, images: [
          "fig5_with-attributes_edge-connection_old-algorithm",
          "fig5_with-attributes_edge-connection_new-algorithm",
          "fig5_with-attributes_center-connection_old-algorithm",
          "fig5_with-attributes_center-connection_new-algorithm",
        ] },
        { id: "general-fig5-no", size: [872, 886], zoom: 0.6769, images: [
          "fig5_no-attributes_edge-connection_old-algorithm",
          "fig5_no-attributes_edge-connection_new-algorithm",
          "fig5_no-attributes_center-connection_old-algorithm",
          "fig5_no-attributes_center-connection_new-algorithm",
        ] },
      ],
    },
  ],
};
