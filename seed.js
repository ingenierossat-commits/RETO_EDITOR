/* contenido inicial (el actual del juego v0.30) */
const SEED={
 "frases": {
  "acierto": [
   "{n}, ¡por fin una!",
   "{n}, ¿has mirado el móvil?",
   "Respuesta correcta, increíble",
   "{n}, no te acostumbres",
   "Correcto. Sorpresa total",
   "Eso es, {n}",
   "Vaya, sabía algo",
   "{n}, hoy estás inspirado",
   "Bien jugado, {n}",
   "{n}, la suerte del principiante",
   "Cerebrito, {n}"
  ],
  "fallo": [
   "{n}, ponte a estudiar, has fallado",
   "Madre mía {n}, no saber eso",
   "{n}, eso lo sabe hasta mi abuela",
   "Qué desastre, de verdad",
   "Los libros no muerden, {n}",
   "Ay, ay, ay, {n}",
   "En el colegio no atendías, {n}",
   "Otra vez será",
   "Incorrecto. Cuánto dolor",
   "{n}, piensa antes de hablar",
   "Ni de casualidad, {n}",
   "Eso ha dolido, {n}",
   "{n}, menos fútbol y más libros",
   "Con ese cerebro vamos lejos, {n}. Hacia atrás"
  ],
  "tiempo": [
   "Se te ha dormido el cerebro, {n}",
   "El tiempo es oro y tú, cero",
   "¿Estabas pensando o descansando, {n}?",
   "Qué lentitud, {n}",
   "Hemos esperado, y para nada",
   "{n}, el reloj no perdona",
   "Tiempo agotado. {n} se ha quedado en blanco",
   "{n}, ¿te has ido a por un café?",
   "Cuando quieras, {n}. Ah, ya no",
   "{n}, a ese ritmo llegamos mañana"
  ],
  "chupito": [
   "{n}, vaya cogorza que vas a coger",
   "{n}, hoy no te levantas de la silla",
   "Eso es, {n}, a beber como un campeón",
   "Que no se diga que {n} no sabe disfrutar",
   "{n}, mañana te va a doler la cabeza",
   "Hígado de {n}, te echaremos de menos",
   "{n}, esto no es agua, aunque lo parezca",
   "{n}, por tu salud, o por la de tu hígado",
   "Salud, {n}",
   "El hígado de {n} no se queja, todavía"
  ]
 },
 "sabias": [
  {
   "t": "el pulpo tiene tres corazones",
   "v": true,
   "n": 1
  },
  {
   "t": "la miel casi nunca se estropea",
   "v": true,
   "n": 1
  },
  {
   "t": "los murcielagos son ciegos",
   "v": false,
   "n": 1
  },
  {
   "t": "solo usamos el 10 % de nuestro cerebro",
   "v": false,
   "n": 2
  },
  {
   "t": "el tomate es botanicamente una fruta",
   "v": true,
   "n": 2
  },
  {
   "t": "un rayo nunca cae dos veces en el mismo sitio",
   "v": false,
   "n": 2
  },
  {
   "t": "en Venus un dia dura mas que un año",
   "v": true,
   "n": 3
  },
  {
   "t": "la Gran Muralla china se ve a simple vista desde la Luna",
   "v": false,
   "n": 3
  },
  {
   "t": "el camaron tiene el corazon en la cabeza",
   "v": true,
   "n": 3
  },
  {
   "t": "los koalas tienen huellas dactilares muy parecidas a las humanas",
   "v": true,
   "n": 4
  },
  {
   "t": "la Torre Eiffel mide unos centimetros mas en verano por la dilatacion del metal",
   "v": true,
   "n": 4
  },
  {
   "t": "el Everest es la montaña mas alta del mundo si se mide desde su base",
   "v": false,
   "n": 4
  },
  {
   "t": "los wombats producen excrementos en forma de cubo",
   "v": true,
   "n": 5
  },
  {
   "t": "Venus gira sobre si mismo en sentido contrario a la mayoria de los planetas",
   "v": true,
   "n": 5
  }
 ],
 "cartas": [
  {
   "k": "chupito",
   "t": "$S se toma un chupito.",
   "p": false
  },
  {
   "k": "chupito",
   "t": "$S se toma un chupito y elige a otro jugador que lo acompañe.",
   "p": false
  },
  {
   "k": "chupito",
   "t": "$S y $A se toman un chupito.",
   "p": false
  },
  {
   "k": "chupito",
   "t": "$S y el último de la mesa se toman un chupito.",
   "p": false
  },
  {
   "k": "chupito",
   "t": "$S y el primero de la mesa se toman un chupito.",
   "p": false
  },
  {
   "k": "chupito",
   "t": "$S reparte dos tragos entre los demás jugadores.",
   "p": false
  },
  {
   "k": "chupito",
   "t": "$S brinda con todos y se toma un chupito.",
   "p": false
  },
  {
   "k": "mover",
   "t": "$S avanza una casilla.",
   "p": false
  },
  {
   "k": "mover",
   "t": "$S avanza dos casillas.",
   "p": false
  },
  {
   "k": "mover",
   "t": "$S retrocede una casilla.",
   "p": true
  },
  {
   "k": "mover",
   "t": "$S retrocede dos casillas.",
   "p": true
  }
 ],
 "temas": [
  {
   "s": "historia",
   "n": "Historia"
  },
  {
   "s": "ciencia",
   "n": "Ciencia"
  },
  {
   "s": "geografia",
   "n": "Geografía"
  }
 ],
 "preguntas": [
  {
   "s": "historia",
   "q": "¿En qué año llegó Cristóbal Colón a América por primera vez?",
   "o": [
    "1492",
    "1498",
    "1512"
   ],
   "c": 0
  },
  {
   "s": "historia",
   "q": "¿Qué civilización construyó Machu Picchu?",
   "o": [
    "Azteca",
    "Inca",
    "Maya"
   ],
   "c": 1
  },
  {
   "s": "historia",
   "q": "¿En qué año cayó el Muro de Berlín?",
   "o": [
    "1961",
    "1975",
    "1989"
   ],
   "c": 2
  },
  {
   "s": "historia",
   "q": "¿Quién fue el primer emperador de Roma?",
   "o": [
    "Augusto",
    "Julio César",
    "Nerón"
   ],
   "c": 0
  },
  {
   "s": "historia",
   "q": "¿En qué año comenzó la Primera Guerra Mundial?",
   "o": [
    "1905",
    "1914",
    "1939"
   ],
   "c": 1
  },
  {
   "s": "historia",
   "q": "¿Qué rey de España es conocido como «el Prudente»?",
   "o": [
    "Carlos I",
    "Felipe IV",
    "Felipe II"
   ],
   "c": 2
  },
  {
   "s": "historia",
   "q": "¿Qué reina de Egipto tuvo relación con Julio César y Marco Antonio?",
   "o": [
    "Cleopatra",
    "Nefertiti",
    "Hatshepsut"
   ],
   "c": 0
  },
  {
   "s": "historia",
   "q": "¿En qué año comenzó la Revolución Francesa?",
   "o": [
    "1776",
    "1789",
    "1815"
   ],
   "c": 1
  },
  {
   "s": "historia",
   "q": "¿Qué imperio fundó Gengis Kan?",
   "o": [
    "Otomano",
    "Persa",
    "Mongol"
   ],
   "c": 2
  },
  {
   "s": "historia",
   "q": "¿En qué año terminó la Segunda Guerra Mundial?",
   "o": [
    "1945",
    "1944",
    "1950"
   ],
   "c": 0
  },
  {
   "s": "ciencia",
   "q": "¿Cuál es el símbolo químico del oro?",
   "o": [
    "Ag",
    "Au",
    "Or"
   ],
   "c": 1
  },
  {
   "s": "ciencia",
   "q": "¿Cuántos huesos tiene el cuerpo de un adulto?",
   "o": [
    "190",
    "212",
    "206"
   ],
   "c": 2
  },
  {
   "s": "ciencia",
   "q": "¿Qué gas absorben las plantas para hacer la fotosíntesis?",
   "o": [
    "Dióxido de carbono",
    "Oxígeno",
    "Nitrógeno"
   ],
   "c": 0
  },
  {
   "s": "ciencia",
   "q": "¿A qué temperatura hierve el agua a nivel del mar?",
   "o": [
    "90 °C",
    "100 °C",
    "120 °C"
   ],
   "c": 1
  },
  {
   "s": "ciencia",
   "q": "¿Quién formuló la teoría de la relatividad?",
   "o": [
    "Newton",
    "Galileo",
    "Einstein"
   ],
   "c": 2
  },
  {
   "s": "ciencia",
   "q": "¿Cuál es el órgano más grande del cuerpo humano?",
   "o": [
    "La piel",
    "El hígado",
    "Los pulmones"
   ],
   "c": 0
  },
  {
   "s": "ciencia",
   "q": "¿Qué partícula del átomo tiene carga eléctrica negativa?",
   "o": [
    "Protón",
    "Electrón",
    "Neutrón"
   ],
   "c": 1
  },
  {
   "s": "ciencia",
   "q": "¿Cuál es el elemento químico más abundante del universo?",
   "o": [
    "Helio",
    "Oxígeno",
    "Hidrógeno"
   ],
   "c": 2
  },
  {
   "s": "ciencia",
   "q": "¿En qué unidad se mide la fuerza en el Sistema Internacional?",
   "o": [
    "Newton",
    "Julio",
    "Vatio"
   ],
   "c": 0
  },
  {
   "s": "ciencia",
   "q": "¿Qué metal es líquido a temperatura ambiente?",
   "o": [
    "Plomo",
    "Mercurio",
    "Cobre"
   ],
   "c": 1
  },
  {
   "s": "geografia",
   "q": "¿Cuál es la capital de Australia?",
   "o": [
    "Sídney",
    "Melbourne",
    "Canberra"
   ],
   "c": 2
  },
  {
   "s": "geografia",
   "q": "¿Cuál es el río más largo de Europa?",
   "o": [
    "Volga",
    "Danubio",
    "Rin"
   ],
   "c": 0
  },
  {
   "s": "geografia",
   "q": "¿Cuál es el desierto cálido más grande del mundo?",
   "o": [
    "Gobi",
    "Sáhara",
    "Kalahari"
   ],
   "c": 1
  },
  {
   "s": "geografia",
   "q": "¿Cuál es la montaña más alta del mundo sobre el nivel del mar?",
   "o": [
    "K2",
    "Kilimanjaro",
    "Everest"
   ],
   "c": 2
  },
  {
   "s": "geografia",
   "q": "¿Cuál es el océano más grande del planeta?",
   "o": [
    "Pacífico",
    "Atlántico",
    "Índico"
   ],
   "c": 0
  },
  {
   "s": "geografia",
   "q": "¿Cuál es el país más grande del mundo por superficie?",
   "o": [
    "Canadá",
    "Rusia",
    "China"
   ],
   "c": 1
  },
  {
   "s": "geografia",
   "q": "¿Cuál es la capital de Canadá?",
   "o": [
    "Toronto",
    "Vancouver",
    "Ottawa"
   ],
   "c": 2
  },
  {
   "s": "geografia",
   "q": "¿Cuál es la capital de Japón?",
   "o": [
    "Tokio",
    "Osaka",
    "Kioto"
   ],
   "c": 0
  },
  {
   "s": "geografia",
   "q": "¿Qué río atraviesa la ciudad de Zaragoza?",
   "o": [
    "Tajo",
    "Ebro",
    "Duero"
   ],
   "c": 1
  },
  {
   "s": "geografia",
   "q": "¿Cuál es el lago más grande de África?",
   "o": [
    "Tanganica",
    "Malaui",
    "Victoria"
   ],
   "c": 2
  }
 ]
};
