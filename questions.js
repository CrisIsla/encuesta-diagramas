// The survey: its texts, the screenshots and the questions.
//
// Two questions about the person first ("perfil"), then two parts, all in the
// order of `blocks`: the rankings of the screenshots below; then "palabra",
// which shows each of its diagrams once, half of them in the old layout and
// half in the new (at random), and asks what the diagram represents. Its
// answers are scored against `accept` (right) and `near` (the other place the
// names also fit).
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
  id: "encuesta-2026-10-21d",
  title: "Encuesta de diagramas",

  welcome: `Esta encuesta tiene dos partes, tras dos preguntas sobre ti. Primero ordenarás varias versiones de un mismo diagrama entidad-relación según cuál te gusta más. Después verás otros diagramas, uno a la vez, y elegirás entre tres opciones qué representa cada uno.

Toma unos 10 minutos.`,

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
        { id: "perfil-curso", prompt: "¿Has cursado el curso Bases de Datos (CC3102)?", options: ["Sí", "No", "Lo estoy cursando"] },
        { id: "perfil-er", prompt: "¿Sabes lo que es un diagrama entidad-relación?", options: ["Sí", "Más o menos", "No"] },
      ],
    },
    {
      // Overall preference. Each question shows every version that exists of
      // one diagram with or without attributes.
      id: "general",
      shuffle: true,
      intro: {
        title: "Parte 1 de 2: ¿Cuál te gusta más?",
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
    {
      "id": "palabra",
      "type": "palabra",
      "intro": {
        "title": "Parte 2 de 2: ¿Qué representa?",
        "text": "Ahora verás otros 8 diagramas, uno a la vez. En cada uno, elige entre tres opciones qué representa.\n\nResponde lo más rápido que puedas, sin equivocarte: el tiempo corre desde que tocas «Ver diagrama». Primero hay uno de práctica."
      },
      "prompt": "¿Qué representa este diagrama?",
      "hint": "Elige una de las tres opciones.",
      "practice": [
        {
          "id": "p2-taller",
          "size": [772, 886],
          "zoom": 0.9161,
          "images": {
            "old": "img/dz8acb.png",
            "new": "img/bm33mm.png"
          },
          "expected": "taller de bicicletas",
          "options": ["Taller de bicicletas", "Tienda de ropa", "Colegio"],
          "accept": [
            "taller de bicicletas",
            "taller",
            "bicicletería",
            "reparación de bicicletas",
            "mecánica de bicicletas",
            "taller mecánico"
          ],
          "near": []
        }
      ],
      "diagrams": [
        {
          "id": "1-biblioteca",
          "size": [1059, 886],
          "zoom": 0.757,
          "images": {
            "old": "img/9sbzsw.png",
            "new": "img/24xhv9.png"
          },
          "expected": "biblioteca",
          "options": ["Biblioteca", "Gimnasio", "Banco"],
          "accept": [
            "biblioteca",
            "biblioteca pública",
            "biblioteca municipal",
            "préstamo de libros",
            "préstamos de libros"
          ],
          "near": [
            "librería",
            "tienda de libros",
            "venta de libros",
            "editorial"
          ]
        },
        {
          "id": "2-cine",
          "size": [1008, 886],
          "zoom": 0.9118,
          "images": {
            "old": "img/d9rh9p.png",
            "new": "img/gga7kx.png"
          },
          "expected": "cine",
          "options": ["Cine", "Fábrica", "Peluquería"],
          "accept": [
            "cine",
            "cines",
            "sala de cine",
            "multicine",
            "cartelera de cine"
          ],
          "near": [
            "teatro",
            "obra de teatro",
            "sala de teatro"
          ]
        },
        {
          "id": "3-aeropuerto",
          "size": [857, 886],
          "zoom": 0.76,
          "images": {
            "old": "img/fbxg6v.png",
            "new": "img/77py79.png"
          },
          "expected": "aeropuerto",
          "options": ["Aeropuerto", "Restaurante", "Universidad"],
          "accept": [
            "aeropuerto",
            "aerolínea",
            "vuelos",
            "terminal aérea",
            "aeródromo",
            "aviones"
          ],
          "near": [
            "terminal de buses",
            "terminal de bus",
            "buses",
            "bus",
            "rodoviario",
            "estación de trenes",
            "tren"
          ]
        },
        {
          "id": "4-remates",
          "size": [823, 886],
          "zoom": 0.7162,
          "images": {
            "old": "img/9kzxfm.png",
            "new": "img/9cvwc2.png"
          },
          "expected": "casa de remates",
          "options": ["Casa de remates", "Escuela de manejo", "Lavandería"],
          "accept": [
            "casa de remates",
            "remate",
            "remates",
            "subasta",
            "subastas",
            "casa de subastas"
          ],
          "near": [
            "museo",
            "galería",
            "galería de arte",
            "exposición",
            "exhibición"
          ]
        },
        {
          "id": "5-hospital",
          "size": [923, 886],
          "zoom": 0.8595,
          "images": {
            "old": "img/k9sm7w.png",
            "new": "img/3gr78x.png"
          },
          "expected": "hospital",
          "options": ["Hospital", "Supermercado", "Estadio"],
          "accept": [
            "hospital",
            "clínica",
            "hospitalización",
            "centro de salud",
            "urgencia"
          ],
          "near": [
            "hotel",
            "hostal",
            "motel",
            "residencial",
            "hostería"
          ]
        },
        {
          "id": "6-veterinaria",
          "size": [802, 886],
          "zoom": 0.6527,
          "images": {
            "old": "img/b429a3.png",
            "new": "img/a7vr92.png"
          },
          "expected": "veterinaria",
          "options": ["Veterinaria", "Correo", "Constructora"],
          "accept": [
            "veterinaria",
            "veterinario",
            "clínica veterinaria",
            "hospital veterinario",
            "mascotas"
          ],
          "near": [
            "clínica",
            "hospital",
            "consultorio",
            "centro médico",
            "centro de salud"
          ]
        },
        {
          "id": "7-zoologico",
          "size": [824, 886],
          "zoom": 0.6472,
          "images": {
            "old": "img/x8qmxq.png",
            "new": "img/p9bzp2.png"
          },
          "expected": "zoológico",
          "options": ["Zoológico", "Cafetería", "Automotora"],
          "accept": [
            "zoológico",
            "zoo",
            "bioparque",
            "parque zoológico"
          ],
          "near": []
        },
        {
          "id": "8-bomberos",
          "size": [1133, 886],
          "zoom": 0.8585,
          "images": {
            "old": "img/dvggkz.png",
            "new": "img/22r6fb.png"
          },
          "expected": "bomberos",
          "options": ["Bomberos", "Pizzería", "Hotel"],
          "accept": [
            "bomberos",
            "bombero",
            "cuerpo de bomberos",
            "compañía de bomberos"
          ],
          "near": []
        }
      ]
    },
  ],
};
