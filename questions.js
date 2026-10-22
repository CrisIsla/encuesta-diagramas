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
  id: "encuesta-2026-10-22",
  title: "Encuesta de diagramas",

  welcome: `Esta encuesta tiene tres partes, tras dos preguntas sobre ti. Primero ordenarás varias versiones de un mismo diagrama entidad-relación según cuál te gusta más. Después verás otros diagramas, uno a la vez, y elegirás entre tres opciones qué representa cada uno. Al final responderás algunas preguntas sobre otros diagramas.

Toma unos 20 minutos.`,

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
        title: "Parte 1 de 3: ¿Cuál te gusta más?",
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
        "title": "Parte 2 de 3: ¿Qué representa?",
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
    {
      // Questions about a diagram, like the readability test in ~/test-legibilidad: each person gets one of four
      // counterbalanced versions, half the diagrams in each layout, a 45 s limit per question and an ease rating per diagram.
      "id": "preguntas",
      "type": "preguntas",
      "intro": {
        "title": "Parte 3 de 3: Preguntas sobre el diagrama",
        "text": "Ahora verás otros diagramas, con dos o tres preguntas sobre cada uno (por ejemplo, a qué elemento pertenece un atributo).\n\nPrimero aparece la pregunta. Cuando la hayas leído, toca «Ver diagrama» y responde lo más rápido que puedas, sin equivocarte: el tiempo corre desde que aparece el diagrama. Tienes 45 segundos por pregunta, y puedes responder «No sé». Después de cada diagrama te preguntaremos qué tan fácil fue.\n\nPrimero hay dos diagramas de práctica."
      },
      "hint": "Lee la pregunta y luego toca «Ver diagrama».",
      "timeoutSeconds": 45,
      "sets": {
        "X": [
          "a1-puerto",
          "a3-bicicletas",
          "b2-observatorio",
          "c2-orquesta"
        ],
        "Y": [
          "a4-aerocarga",
          "b1-semillas",
          "b3-volcanes",
          "c3-trail"
        ]
      },
      "versions": [
        {
          "version": 1,
          "old": "X",
          "new": "Y",
          "startsWith": "old",
          "practice": {
            "p1-hotel": "old",
            "p2-taller": "new"
          }
        },
        {
          "version": 2,
          "old": "X",
          "new": "Y",
          "startsWith": "new",
          "practice": {
            "p1-hotel": "new",
            "p2-taller": "old"
          }
        },
        {
          "version": 3,
          "old": "Y",
          "new": "X",
          "startsWith": "old",
          "practice": {
            "p1-hotel": "old",
            "p2-taller": "new"
          }
        },
        {
          "version": 4,
          "old": "Y",
          "new": "X",
          "startsWith": "new",
          "practice": {
            "p1-hotel": "new",
            "p2-taller": "old"
          }
        }
      ],
      "practice": [
        {
          "id": "p1-hotel",
          "size": [888, 886],
          "zoom": 0.9963,
          "name": "Hotel",
          "images": {
            "old": "img/u1kzvw.png",
            "new": "img/qgasig.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "adjacency",
              "text": "¿Con cuál de estas entidades se relaciona directamente «Piso»?",
              "options": [
                "Huésped",
                "Habitación",
                "Mucama"
              ],
              "answer": "Habitación"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «comentario»?",
              "options": [
                "Huésped",
                "Habitación",
                "Ocupa",
                "Limpia"
              ],
              "answer": "Ocupa"
            },
            {
              "id": "q3",
              "type": "adjacency",
              "text": "¿Qué entidades participan en la relación «Limpia»?",
              "options": [
                "Mucama y Piso",
                "Habitación y Piso",
                "Habitación y Mucama",
                "Huésped y Mucama"
              ],
              "answer": "Habitación y Mucama"
            }
          ]
        },
        {
          "id": "p2-taller",
          "size": [772, 886],
          "zoom": 0.9161,
          "name": "Taller de bicicletas",
          "images": {
            "old": "img/xk0ziq.png",
            "new": "img/dnxs2g.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "adjacency",
              "text": "¿Con cuál de estas entidades se relaciona directamente «Cliente»?",
              "options": [
                "Bicicleta",
                "Mecánico",
                "Repuesto"
              ],
              "answer": "Bicicleta"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «codigo_interno»?",
              "options": [
                "Mecánico",
                "Cliente",
                "Repuesto",
                "Bicicleta"
              ],
              "answer": "Mecánico"
            },
            {
              "id": "q3",
              "type": "adjacency",
              "text": "¿Qué entidades participan en la relación «Pide»?",
              "options": [
                "Mecánico y Repuesto",
                "Cliente y Repuesto",
                "Cliente y Mecánico",
                "Bicicleta y Repuesto"
              ],
              "answer": "Mecánico y Repuesto"
            }
          ]
        }
      ],
      "diagrams": [
        {
          "id": "a1-puerto",
          "size": [829, 886],
          "zoom": 0.6101,
          "name": "Terminal portuaria de contenedores",
          "images": {
            "old": "img/u8syhw.png",
            "new": "img/yxcfxq.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "adjacency",
              "text": "¿Cuál de estas entidades está conectada a un mismo rombo que «Contenedor»?",
              "options": [
                "Apiladora",
                "Bloque",
                "Grúa_pórtico",
                "Operador"
              ],
              "answer": "Bloque"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «fecha_alta»?",
              "options": [
                "Asignada",
                "Equipo",
                "Mueve",
                "Operador"
              ],
              "answer": "Equipo"
            },
            {
              "id": "q3",
              "type": "ternary",
              "text": "¿Qué entidades participan en la relación «Atiende»?",
              "options": [
                "Apiladora, Bloque y Buque",
                "Apiladora, Contenedor y Operador",
                "Bloque, Contenedor y Grúa_pórtico",
                "Buque, Grúa_pórtico y Operador"
              ],
              "answer": "Buque, Grúa_pórtico y Operador"
            }
          ]
        },
        {
          "id": "a3-bicicletas",
          "size": [1214, 886],
          "zoom": 0.5729,
          "name": "Red de bicicletas públicas",
          "images": {
            "old": "img/pnpcxa.png",
            "new": "img/oeglla.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "adjacency",
              "text": "¿Cuál de estas entidades está conectada a un mismo rombo que «Bicicleta»?",
              "options": [
                "Bodega",
                "Camioneta",
                "Taller",
                "Técnico"
              ],
              "answer": "Taller"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «horario»?",
              "options": [
                "Anclada",
                "Asignado",
                "Camioneta",
                "Instalación"
              ],
              "answer": "Instalación"
            },
            {
              "id": "q3",
              "type": "ternary",
              "text": "¿Qué entidades participan en la relación «Visita»?",
              "options": [
                "Bicicleta, Estación y Usuario",
                "Bicicleta, Taller y Técnico",
                "Camioneta, Estación y Técnico",
                "Camioneta, Taller y Usuario"
              ],
              "answer": "Camioneta, Estación y Técnico"
            }
          ]
        },
        {
          "id": "a4-aerocarga",
          "size": [1131, 886],
          "zoom": 0.7201,
          "name": "Aerolínea regional de carga",
          "images": {
            "old": "img/ngkqoa.png",
            "new": "img/qtmmla.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "adjacency",
              "text": "¿Cuál de estas entidades está conectada a un mismo rombo que «Pallet»?",
              "options": [
                "Aeródromo",
                "Avión",
                "Bulto",
                "Sobre"
              ],
              "answer": "Bulto"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «tarifa»?",
              "options": [
                "Cliente",
                "Despacha",
                "Embarca",
                "Envío"
              ],
              "answer": "Envío"
            },
            {
              "id": "q3",
              "type": "ternary",
              "text": "¿Qué entidades participan en la relación «Retira»?",
              "options": [
                "Aeródromo, Cliente y Sobre",
                "Aeródromo, Pallet y Vuelo",
                "Avión, Cliente y Pallet",
                "Avión, Sobre y Vuelo"
              ],
              "answer": "Aeródromo, Cliente y Sobre"
            }
          ]
        },
        {
          "id": "b1-semillas",
          "size": [1007, 886],
          "zoom": 0.6211,
          "name": "Banco de semillas",
          "images": {
            "old": "img/vpwuxq.png",
            "new": "img/ynd61q.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "path",
              "text": "Para ir de «Especie» a «Ensayo» por el camino más corto, ¿por qué entidad hay que pasar?",
              "options": [
                "Lote",
                "Cámara",
                "Sitio",
                "Analista"
              ],
              "answer": "Lote"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «nivel»?",
              "options": [
                "Analista",
                "Especie",
                "Realiza",
                "Ensayo"
              ],
              "answer": "Analista"
            },
            {
              "id": "q3",
              "type": "aggregation",
              "text": "¿Qué relación está dentro de la agregación «Procedencia»?",
              "options": [
                "Almacena",
                "Evalúa",
                "Aporta",
                "Visita"
              ],
              "answer": "Visita"
            }
          ]
        },
        {
          "id": "b2-observatorio",
          "size": [1023, 886],
          "zoom": 0.6472,
          "name": "Radioobservatorio",
          "images": {
            "old": "img/emcswq.png",
            "new": "img/zsal5q.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "path",
              "text": "Para ir de «Investigador» a «Fuente» por el camino más corto, ¿por qué entidad hay que pasar?",
              "options": [
                "Instrumento",
                "Proyecto",
                "Imagen",
                "Antena"
              ],
              "answer": "Proyecto"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «estado»?",
              "options": [
                "Monta",
                "Instrumento",
                "Antena",
                "Reserva"
              ],
              "answer": "Antena"
            },
            {
              "id": "q3",
              "type": "weak",
              "text": "¿Qué entidad identifica a la entidad débil «Imagen»?",
              "options": [
                "Antena",
                "Instrumento",
                "Fuente",
                "Investigador"
              ],
              "answer": "Instrumento"
            }
          ]
        },
        {
          "id": "b3-volcanes",
          "size": [804, 886],
          "zoom": 0.6106,
          "name": "Red de monitoreo volcánico",
          "images": {
            "old": "img/zgkc4a.png",
            "new": "img/bv2uzg.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "path",
              "text": "Para ir de «Comuna» a «Cerro» por el camino más corto, ¿por qué entidad hay que pasar?",
              "options": [
                "Estación",
                "Técnico",
                "Sensor",
                "Alerta"
              ],
              "answer": "Alerta"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «estado»?",
              "options": [
                "Instala",
                "Estación",
                "Sensor",
                "Comuna"
              ],
              "answer": "Sensor"
            },
            {
              "id": "q3",
              "type": "weak",
              "text": "¿Qué entidad identifica a la entidad débil «Mantención»?",
              "options": [
                "Cerro",
                "Técnico",
                "Estación",
                "Sensor"
              ],
              "answer": "Estación"
            }
          ]
        },
        {
          "id": "c2-orquesta",
          "size": [669, 886],
          "zoom": 0.5044,
          "name": "Orquesta juvenil",
          "images": {
            "old": "img/fs6asg.png",
            "new": "img/ttic1a.png"
          },
          "items": [
            {
              "id": "q1",
              "type": "adjacency",
              "text": "¿Cuál de estas entidades participa en una misma relación con «Músico»?",
              "options": [
                "Director",
                "Sala",
                "Concierto",
                "Obra"
              ],
              "answer": "Concierto"
            },
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «observacion»?",
              "options": [
                "Practica_con",
                "Toca_en",
                "Comparte_atril",
                "Concierto"
              ],
              "answer": "Toca_en"
            }
          ]
        },
        {
          "id": "c3-trail",
          "size": [1035, 886],
          "zoom": 0.6306,
          "name": "Carrera de trail",
          "images": {
            "old": "img/i3m7nw.png",
            "new": "img/dev87w.png"
          },
          "items": [
            {
              "id": "q2",
              "type": "attribute_owner",
              "text": "¿A qué elemento pertenece el atributo «fecha_alta»?",
              "options": [
                "Club",
                "Pertenece",
                "Organiza",
                "Evento"
              ],
              "answer": "Club"
            },
            {
              "id": "q3",
              "type": "aggregation",
              "text": "¿Qué entidades forman parte de la agregación «Participación»?",
              "options": [
                "Distancia y Club",
                "Corredor y Evento",
                "Corredor y Distancia",
                "Club y Evento"
              ],
              "answer": "Corredor y Distancia"
            }
          ]
        }
      ]
    }
  ],
};
