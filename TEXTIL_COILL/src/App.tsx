import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Factory,
  Facebook,
  Instagram,
  LayoutGrid,
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Palette,
  Ruler,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
  Youtube,
} from 'lucide-react';

type Fabric = {
  name: string;
  category: string;
  composition: string;
  description: string;
  image: string;
  badge: string;
  gsm: number[];
  width: string;
  yield: string;
  colors: { name: string; value: string }[];
  features: string[];
  uses: string[];
};

const fabricImages = {
  blue: 'https://images.pexels.com/photos/6044191/pexels-photo-6044191.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  wool: 'https://images.pexels.com/photos/13717230/pexels-photo-13717230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  satin: 'https://images.pexels.com/photos/1487809/pexels-photo-1487809.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  denim: 'https://images.pexels.com/photos/8817549/pexels-photo-8817549.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  rolls: 'https://images.pexels.com/photos/236748/pexels-photo-236748.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
};

const fabrics: Fabric[] = [
  { name: 'Jersey High Cotton', category: 'Algodón', composition: '100% Algodón', description: 'Tejido de punto premium, suave y estable para prendas que mantienen su forma.', image: fabricImages.blue, badge: 'Más vendido', gsm: [230, 260, 295, 300], width: '0.85 – 0.95 m', yield: '1.75 – 2.56 mt/kg', colors: [{ name: 'Crudo', value: '#d9d0be' }, { name: 'Camel', value: '#99816c' }, { name: 'Chocolate', value: '#4c362d' }, { name: 'Negro', value: '#18191d' }, { name: 'Azul noche', value: '#172b45' }, { name: 'Verde olivo', value: '#5a604b' }], features: ['Algodón peinado', 'Teñido reactivo', 'Con antipilling', 'Rollos de 20 kg aprox.'], uses: ['Polos oversize', 'Boxy fit', 'Polos urbanos'] },
  { name: 'Gamuza', category: 'Algodón', composition: '100% Algodón', description: 'Superficie aterciopelada y cálida con caída elegante para colecciones modernas.', image: fabricImages.satin, badge: 'Premium', gsm: [240, 260, 280], width: '1.60 m', yield: '2.5 – 2.7 mt/kg', colors: [{ name: 'Arena', value: '#c5b69a' }, { name: 'Taupe', value: '#95816a' }, { name: 'Borgoña', value: '#5d2431' }, { name: 'Grafito', value: '#48484b' }, { name: 'Azul', value: '#1a2e4a' }], features: ['Tacto suave', 'Caída elegante', 'Alta durabilidad', 'Fácil mantenimiento'], uses: ['Polos', 'Hoodies', 'Pantalones', 'Conjuntos'] },
  { name: 'Franela', category: 'Mezclas / Lycra', composition: '65% Poliéster + 35% Algodón', description: 'Calidez y confort con acabado consistente, ideal para temporadas de frío.', image: fabricImages.wool, badge: 'Versátil', gsm: [240, 280, 300], width: '1.80 m', yield: '2.2 mt/kg', colors: [{ name: 'Gris melange', value: '#a2a2a0' }, { name: 'Plomo', value: '#5f6264' }, { name: 'Negro', value: '#161719' }, { name: 'Azul', value: '#26364f' }], features: ['Calidez superior', 'Tacto confortable', 'Fácil de confeccionar', 'Color estable'], uses: ['Poleras', 'Hoodies', 'Joggers'] },
  { name: 'French Terry', category: 'Algodón', composition: '100% Algodón', description: 'Textura respirable y estructura ligera para prendas premium de uso diario.', image: fabricImages.rolls, badge: 'Nuevo', gsm: [240, 260, 280], width: '1.80 m', yield: '2.3 mt/kg', colors: [{ name: 'Hueso', value: '#d7d2c6' }, { name: 'Gris', value: '#8d8f8c' }, { name: 'Marino', value: '#18263c' }, { name: 'Negro', value: '#111315' }], features: ['100% algodón', 'Interior absorbente', 'Respirable', 'Acabado premium'], uses: ['Polos', 'Buzos', 'Conjuntos'] },
  { name: 'Full Lycra', category: 'Mezclas / Lycra', composition: '96% Algodón + 4% Lycra', description: 'Máxima elasticidad y recuperación para siluetas ajustadas y dinámicas.', image: fabricImages.denim, badge: 'Elasticidad', gsm: [180, 220, 260], width: '1.70 m', yield: '2.8 mt/kg', colors: [{ name: 'Blanco', value: '#e9e7df' }, { name: 'Rojo', value: '#9a3440' }, { name: 'Verde', value: '#4f6757' }, { name: 'Negro', value: '#161719' }], features: ['Elasticidad 4 vías', 'Recuperación superior', 'Tacto suave', 'Color duradero'], uses: ['Polos fit', 'Ropa deportiva', 'Básicos'] },
  { name: 'Viscosa', category: 'Viscosa', composition: '96% Viscosa + 4% Spandex', description: 'Fluidez, frescura y un tacto ligero para prendas con movimiento.', image: fabricImages.blue, badge: 'Fresco', gsm: [180, 200, 220], width: '1.60 m', yield: '3.0 mt/kg', colors: [{ name: 'Marfil', value: '#e6ddcc' }, { name: 'Rosa', value: '#b87978' }, { name: 'Petróleo', value: '#20545a' }, { name: 'Negro', value: '#17181a' }], features: ['Caída fluida', 'Frescura natural', 'Tacto sedoso', 'Ligera elasticidad'], uses: ['Vestidos', 'Blusas', 'Polos', 'Faldas'] },
  { name: 'Interlock', category: 'Algodón', composition: '100% Algodón', description: 'Doble punto compacto, suave y resistente para prendas de alto tráfico.', image: fabricImages.wool, badge: 'Resistente', gsm: [240, 280, 300], width: '1.80 m', yield: '2.1 mt/kg', colors: [{ name: 'Natural', value: '#d6c9b5' }, { name: 'Gris', value: '#7f8587' }, { name: 'Azul', value: '#253a55' }, { name: 'Negro', value: '#141617' }], features: ['Doble punto', 'Alta resistencia', 'Superficie uniforme', 'Lavado estable'], uses: ['Polos', 'Ropa infantil', 'Básicos'] },
];

const phones = ['51998132682', '51946010973', '51955229651'];

function App() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quoteFabric, setQuoteFabric] = useState('Jersey High Cotton');
  const [quoteColor, setQuoteColor] = useState('Negro');
  const [quantity, setQuantity] = useState('20');
  const [destination, setDestination] = useState('Lima');
  const [service, setService] = useState('Solo tela');
  const [selectedGsm, setSelectedGsm] = useState(260);

  const visibleFabrics = useMemo(() => activeFilter === 'Todos' ? fabrics : fabrics.filter((fabric) => fabric.category === activeFilter), [activeFilter]);

  const openQuote = (fabricName?: string) => {
    if (fabricName) setQuoteFabric(fabricName);
    setQuoteOpen(true);
    setSelectedFabric(null);
  };

  const sendQuote = () => {
    const message = `Hola, Textil Coill. Deseo solicitar una cotización:%0A%0AProducto: ${quoteFabric}%0AColor: ${quoteColor}%0ACantidad: ${quantity} kg%0ADestino: ${destination}%0AProceso: ${service}%0A%0AQuedo atento(a) a su asesoría.`;
    const phone = phones[Number(localStorage.getItem('coill-agent') ?? '0') % phones.length];
    localStorage.setItem('coill-agent', String((Number(localStorage.getItem('coill-agent') ?? '0') + 1) % phones.length));
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener,noreferrer');
    setQuoteOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f4] text-[#0d1d31]">
      <div className="topbar"><div className="container flex items-center justify-between"><span>Atención personalizada para tu próxima colección</span><span className="hidden sm:inline">Lima · Perú / Envíos nacionales e internacionales</span></div></div>
      <header className="site-header">
        <div className="container flex h-[76px] items-center justify-between">
          <a href="#inicio" className="brand" aria-label="Textil Coill inicio"><span className="brand-mark">TC</span><span>TEXTIL <b>COILL</b><small>COMERCIAL S.R.L.</small></span></a>
          <nav className="hidden items-center gap-8 lg:flex">
            {['Inicio', 'Catálogo', 'Servicios', 'Nosotros', 'Contacto'].map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">{item}</a>)}
          </nav>
          <div className="flex items-center gap-3"><button onClick={() => openQuote()} className="button button-dark hidden sm:flex">CATÁLOGOS PDF <ArrowRight size={15} /></button><button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-full p-2 lg:hidden" aria-label="Abrir menú">{mobileOpen ? <X /> : <Menu />}</button></div>
        </div>
        {mobileOpen && <nav className="mobile-nav lg:hidden">{['Inicio', 'Catálogo', 'Servicios', 'Nosotros', 'Contacto'].map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileOpen(false)}>{item}</a>)}</nav>}
      </header>

      <main>
        <section id="inicio" className="hero-section"><div className="hero-image" /><div className="container relative z-10 flex min-h-[650px] items-center"><div className="max-w-2xl pt-16"><p className="eyebrow light"><Sparkles size={14} /> Tecnología · Calidad · Innovación</p><h1>Telas premium<br /><em>para marcas</em> y confeccionistas</h1><p className="hero-copy">Más de 20 años abasteciendo a marcas de ropa, talleres, emprendedores y empresas textiles.</p><div className="flex flex-wrap gap-3"><a href="#catalogo" className="button button-light">VER CATÁLOGO <ArrowRight size={16} /></a><button onClick={() => openQuote()} className="button button-outline-light"><MessageCircle size={16} /> SOLICITAR ASESORÍA</button></div><div className="hero-note"><span>01</span><div className="hero-line"><i /></div><span>03</span><small>Abastecimiento textil para crecer</small></div></div></div></section>

        <section id="catalogo" className="section container"><div className="section-heading"><div><p className="eyebrow">Nuestras líneas</p><h2>Explora nuestras telas</h2></div><a href="#catalogo" className="text-link">Ver todas las telas <ArrowRight size={15} /></a></div><div className="filter-row">{['Todos', 'Algodón', 'Mezclas / Lycra', 'Viscosa'].map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}>{filter}</button>)}</div><div className="fabric-grid">{visibleFabrics.map((fabric) => <button key={fabric.name} onClick={() => { setSelectedFabric(fabric); setSelectedGsm(fabric.gsm[1] ?? fabric.gsm[0]); }} className="fabric-card"><div className="fabric-photo"><img src={fabric.image} alt={fabric.name} /><span>{fabric.badge}</span><div className="fabric-overlay"><span>Ver ficha técnica</span><ChevronRight size={16} /></div></div><div className="fabric-info"><div><h3>{fabric.name}</h3><p>{fabric.composition}</p></div><ArrowRight size={18} /></div></button>)}</div></section>

        <section className="promise-strip"><div className="container promise-grid"><div><ShieldCheck /><strong>+20 años</strong><span>de experiencia</span></div><div><Factory /><strong>Producción</strong><span>nacional</span></div><div><BadgeCheck /><strong>Calidad</strong><span>consistente</span></div><div><Truck /><strong>Envíos</strong><span>a todo el Perú</span></div><div><LayoutGrid /><strong>Amplia variedad</strong><span>de telas</span></div></div></section>

        <section id="servicios" className="section services-section"><div className="container"><div className="section-heading"><div><p className="eyebrow">Más que una tela</p><h2>Tu producción, más simple</h2></div><p className="section-lead">Desde el hilo hasta el empaque final, te acompañamos con soluciones que se adaptan al ritmo de tu marca.</p></div><div className="service-grid"><article className="service-card service-featured"><div className="service-number">01 / 03</div><div className="service-icon"><Scissors /></div><h3>Servicio de confección</h3><p>Desarrollamos prendas con acabados profesionales para emprendedores, marcas y empresas del sector textil.</p><button onClick={() => openQuote('Servicio de confección')} className="text-link">Conocer más <ArrowRight size={15} /></button></article><article className="service-card"><div className="service-icon"><Package /></div><h3>Venta de hilo</h3><p>Hilos de calidad para tus procesos de confección, con resistencia, rendimiento y acabados confiables.</p><button onClick={() => openQuote('Hilo textil')} className="text-link">Solicitar información <ArrowRight size={15} /></button></article><article className="service-card"><div className="service-icon"><Ruler /></div><h3>Venta de crudo</h3><p>Tejidos en crudo para procesos de teñido, acabado y desarrollo de colecciones a tu medida.</p><button onClick={() => openQuote('Tela cruda')} className="text-link">Solicitar información <ArrowRight size={15} /></button></article></div></div></section>

        <section id="nosotros" className="about-section"><div className="container about-grid"><div className="about-image"><img src={fabricImages.rolls} alt="Rollos de tela en almacén" /><div className="about-stamp"><strong>20+</strong><span>años moviendo<br />la industria</span></div></div><div className="about-copy"><p className="eyebrow">Quiénes somos</p><h2>Hecho para quienes<br /><em>hacen realidad</em> sus ideas.</h2><p>Comercial Textil Coill S.R.L. nació en 2004 en el Emporio Comercial de Gamarra, con una misión clara: ofrecer productos textiles de excelente calidad y confiabilidad para que nuestros clientes produzcan mejor.</p><p>Hoy contamos con una red de atención cercana y una capacidad productiva que nos permite acompañar a marcas en todo el Perú y el extranjero.</p><div className="location-list"><div><MapPin size={19} /><span><strong>Gamarra</strong> 3 puntos de venta</span></div><div><Building2 size={19} /><span><strong>La Victoria</strong> Oficina administrativa</span></div><div><Factory size={19} /><span><strong>Campoy, SJL</strong> Planta de producción</span></div></div><a href="#contacto" className="button button-dark">CONOCE MÁS <ArrowRight size={16} /></a></div></div></section>

        <section className="cta-section"><div className="cta-text"><p className="eyebrow light">¿Listo para crear?</p><h2>Hagamos crecer<br /><em>tu próxima colección.</em></h2><p>Escríbenos y recibe asesoría personalizada para elegir la tela ideal.</p><button onClick={() => openQuote()} className="button button-light"><MessageCircle size={16} /> ESCRÍBENOS POR WHATSAPP</button></div><div className="cta-photo"><img src={fabricImages.satin} alt="Textura textil azul oscuro" /></div></section>

        <section id="contacto" className="contact-section container"><div><p className="eyebrow">Estamos para ayudarte</p><h2>Hablemos de<br /><em>tu proyecto.</em></h2></div><div className="contact-details"><div><span>WhatsApp comercial</span><strong>+51 998 132 682</strong><button onClick={() => openQuote()} className="text-link">Solicitar asesoría <ArrowRight size={15} /></button></div><div><span>Visítanos</span><strong>Sebastián Barranca 1439 / 1455<br />La Victoria, Lima</strong><span>Jr. Giribaldi 725 · Gamarra</span></div></div></section>
      </main>

      <footer className="footer"><div className="container footer-main"><a href="#inicio" className="brand brand-footer"><span className="brand-mark">TC</span><span>TEXTIL <b>COILL</b><small>COMERCIAL S.R.L.</small></span></a><div className="footer-column"><span className="footer-label">Empresa</span><a href="#nosotros">Nosotros</a><a href="#servicios">Servicios</a><a href="#catalogo">Catálogo</a></div><div className="footer-column"><span className="footer-label">Síguenos</span><div className="socials"><a href="#contacto" aria-label="Instagram"><Instagram size={18} /></a><a href="#contacto" aria-label="Facebook"><Facebook size={18} /></a><a href="#contacto" aria-label="Youtube"><Youtube size={18} /></a></div></div><div className="footer-column"><span className="footer-label">Datos legales</span><span>RUC: 20509059188</span><span>Comercial Textil Coill S.R.L.</span></div></div><div className="container footer-bottom"><span>© 2024 Textil Coill. Todos los derechos reservados.</span><span>Calidad que se siente.</span></div></footer>

      {selectedFabric && <div className="modal-backdrop" onClick={() => setSelectedFabric(null)}><div className="fabric-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedFabric(null)} aria-label="Cerrar ficha"><X size={19} /></button><div className="modal-image"><img src={selectedFabric.image} alt={selectedFabric.name} /><div className="modal-image-copy"><p className="eyebrow light">Ficha técnica</p><h2>{selectedFabric.name}</h2><p>{selectedFabric.description}</p></div></div><div className="modal-content"><div className="modal-topline"><div><span className="field-label">Gramaje disponible</span><div className="gsm-row">{selectedFabric.gsm.map((gsm) => <button key={gsm} onClick={() => setSelectedGsm(gsm)} className={selectedGsm === gsm ? 'selected' : ''}>{gsm}<small>GSM</small></button>)}</div></div><div className="modal-color-block"><span className="field-label">Colores disponibles</span><div className="swatches">{selectedFabric.colors.map((color) => <button key={color.name} onClick={() => setQuoteColor(color.name)} title={color.name} style={{ backgroundColor: color.value }} className={quoteColor === color.name ? 'selected' : ''} />)}</div></div></div><div className="specs"><div><span>Composición</span><strong>{selectedFabric.composition}</strong></div><div><span>Ancho</span><strong>{selectedFabric.width}</strong></div><div><span>Rendimiento</span><strong>{selectedFabric.yield}</strong></div></div><div className="modal-columns"><div><span className="field-label">Características</span>{selectedFabric.features.map((feature) => <p key={feature}><CircleCheck size={15} />{feature}</p>)}</div><div><span className="field-label">Usos recomendados</span>{selectedFabric.uses.map((use) => <p key={use}><ShoppingBag size={15} />{use}</p>)}</div></div><button onClick={() => openQuote(selectedFabric.name)} className="button button-dark modal-cta">SOLICITAR MUESTRA / COTIZACIÓN <MessageCircle size={16} /></button></div></div></div>}

      {quoteOpen && <div className="modal-backdrop" onClick={() => setQuoteOpen(false)}><div className="quote-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setQuoteOpen(false)} aria-label="Cerrar cotizador"><X size={19} /></button><div className="quote-heading"><p className="eyebrow">Cotizador rápido</p><h2>Cuéntanos qué<br /><em>necesitas.</em></h2><p>Te responderemos por WhatsApp con disponibilidad y precios.</p></div><div className="quote-form"><label>¿Qué deseas cotizar?<select value={quoteFabric} onChange={(event) => setQuoteFabric(event.target.value)}>{fabrics.map((fabric) => <option key={fabric.name}>{fabric.name}</option>)}<option>Hilo textil</option><option>Tela cruda</option><option>Servicio de confección</option></select></label><div className="form-grid"><label>Color<input value={quoteColor} onChange={(event) => setQuoteColor(event.target.value)} placeholder="Ej. Negro" /></label><label>Cantidad en kilos<input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label></div><div className="form-grid"><label>Destino<select value={destination} onChange={(event) => setDestination(event.target.value)}><option>Lima</option><option>Provincia</option><option>Internacional</option></select></label><label>Proceso<select value={service} onChange={(event) => setService(event.target.value)}><option>Solo tela</option><option>Confección</option><option>Full Packaging</option></select></label></div><button onClick={sendQuote} className="button button-whatsapp"><MessageCircle size={17} /> ENVIAR COTIZACIÓN POR WHATSAPP <ArrowRight size={16} /></button><small className="round-robin-note">Te atenderá uno de nuestros 3 asesores disponibles.</small></div></div></div>}
    </div>
  );
}

export default App;
