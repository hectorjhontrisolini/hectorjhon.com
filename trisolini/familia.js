// ═══════════════════════════════════════════════════════════
// Archivo Familiar Trisolini — Datos del árbol genealógico
// ═══════════════════════════════════════════════════════════

const familiaData = {
  nodes: [
    { id: 0, label: "Giosuè\nTrisolini", gen: 0,
      rol: "Bisabuelo — Padre de Giuseppe",
      nacimiento: "c. 1784, Carovigno, Brindisi",
      profesion: "Cirujano militar, activista liberal",
      info: "Padre de Giuseppe. Ejerció en el Ospedale della Trinità de Nápoles. Activista en círculos liberales clandestinos contra Fernando II.",
      foto: null, docs: [] },
    { id: 1, label: "Maria Raffaela\nPortanova", gen: 0,
      rol: "Bisabuela — Madre de Giuseppe",
      nacimiento: "c. 1799, Nápoles",
      info: "Madre de Giuseppe. Casada con Giosuè el 24 de marzo de 1819 en la parroquia Avvocata, Nápoles.",
      foto: null, docs: [] },
    { id: 2, label: "Giuseppe Pascuale\nTrisolini Portanova", gen: 1,
      rol: "Tatarabuelo — Teniente del Risorgimento",
      nacimiento: "17 agosto 1829, Distrito Stella, Nápoles",
      grado: "Teniente (28 ene 1849)",
      unidad: "Batallón Veneto-Napoletano",
      info: "Voluntario en las fuerzas del Gral. Guglielmo Pepe. Combatió en Mestre (1848) y Forte Marghera (1849). Ascendido a Teniente por el Gobierno Provisional de Venecia. Exiliado al Perú en 1849.",
      foto: "assets/images/giuseppe.png",
      docs: ["despacho.html", "biografia.html"] },
    { id: 3, label: "Tito Antonino\nTrisolini", gen: 1,
      rol: "Hermano mayor — Médico y Garibaldino",
      nacimiento: "20 diciembre 1824",
      info: "Médico, conspirador mazziniano y voluntario garibaldino. Reconocido combatiente del Risorgimento.",
      foto: null, docs: [] },
    { id: 4, label: "María Mercedes\nTello", gen: 1,
      rol: "Esposa de Giuseppe (en el Perú)",
      info: "Casada con Giuseppe en el Perú. Dio inicio a la descendencia familiar en Ayacucho hacia fines del siglo XIX.",
      foto: null, docs: [] }
  ],
  edges: [
    { from: 0, to: 2, label: "padre" },
    { from: 1, to: 2, label: "madre" },
    { from: 0, to: 3, label: "padre" },
    { from: 1, to: 3, label: "madre" },
    { from: 2, to: 4, label: "matrimonio", dashes: true }
  ]
};
