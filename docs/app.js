(() => {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  const number = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  const hoursNumber = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

  const nav = $('#navigation');
  const menu = $('.menu-toggle');
  const closeMenu = () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Abrir menú'); };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('#navigation a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  let scrollQueued = false;
  const showScrollProgress = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    $('.scroll-progress').style.transform = `scaleX(${height > 0 ? Math.min(1, window.scrollY / height) : 0})`;
    scrollQueued = false;
  };
  window.addEventListener('scroll', () => { if (!scrollQueued) { requestAnimationFrame(showScrollProgress); scrollQueued = true; } }, { passive: true });

  const moduleData = {
    waits: { zone: 'ÁREA DE ESPERA', label: 'ESPERA REGISTRADA', value: '06:24', suffix: ' min', insight: 'Un punto de partida para mejorar el flujo.', rows: [['09:41', 'T-014', 'Ingreso a zona', 'Registrado'], ['09:47', 'T-014', 'Inicio de atención', 'Ver evidencia ↗']] },
    trips: { zone: 'CONTROL DE INGRESOS', label: 'VIAJE IDENTIFICADO', value: 'T-014', suffix: '', insight: 'Un evento para contrastar con el parte del servicio.', rows: [['09:41', 'T-014', 'Ingreso registrado', 'Con evidencia'], ['10:02', 'T-014', 'Salida registrada', 'Para conciliar']] },
    fleet: { zone: 'FLUJO DE VEHÍCULOS', label: 'ESTADO OBSERVABLE', value: 'En carga', suffix: '', insight: 'Llegadas y ciclos para evaluar el uso de la flota.', rows: [['09:47', 'T-014', 'En atención', 'Registrado'], ['09:49', 'T-022', 'En espera', 'Ver evidencia ↗']] }
  };
  let selectedModule = 'waits';
  let selectedGoal = 'waits';
  function activateModule(key) {
    const data = moduleData[key];
    if (!data) return;
    selectedModule = key;
    selectedGoal = key;
    $$('.module-tab').forEach(tab => { const selected = tab.dataset.module === key; tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    $('#module-panel').setAttribute('aria-labelledby', `tab-${key}`);
    $('#zone-caption').textContent = data.zone;
    $('#metric-label').textContent = data.label;
    const metric = $('#metric-value');
    metric.replaceChildren(document.createTextNode(data.value));
    if (data.suffix) { const suffix = document.createElement('span'); suffix.textContent = data.suffix; metric.appendChild(suffix); }
    $('#metric-insight').textContent = data.insight;
    $('#activity-log').replaceChildren(...data.rows.map(row => {
      const container = document.createElement('div');
      row.forEach((value, index) => { const node = document.createElement(index === 1 ? 'b' : index === 3 ? 'i' : 'span'); node.textContent = value; if (index === 3) node.className = 'log-status'; container.appendChild(node); });
      return container;
    }));
  }
  function tabKeys(tabs, activate, keyName) {
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab.dataset[keyName]));
      tab.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        let target = index;
        if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = tabs.length - 1;
        else target = (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
        activate(tabs[target].dataset[keyName]); tabs[target].focus();
      });
    });
  }
  tabKeys($$('.module-tab'), activateModule, 'module');

  const securityLabels = { ppe: 'PUNTO DE PASO / CONTROL DE EPP', access: 'SECTOR RESTRINGIDO / PRESENCIA PARA REVISIÓN', assets: 'PERÍMETRO / EVENTO PARA CONTRASTAR' };
  function activateSecurity(key) {
    if (!securityLabels[key]) return;
    selectedGoal = key;
    $$('.security-tab').forEach(tab => { const selected = tab.dataset.security === key; tab.classList.toggle('active', selected); tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    $$('.security-scene').forEach(scene => { scene.hidden = scene.dataset.scene !== key; });
    $('#security-panel').setAttribute('aria-labelledby', `security-tab-${key}`);
    $('#security-event-label').textContent = securityLabels[key];
  }
  tabKeys($$('.security-tab'), activateSecurity, 'security');

  const videos = $$('video');
  const manuallyPaused = new Set();
  function updateVideoControl(video) {
    const button = $(`[data-video-toggle="${video.id}"]`);
    if (!button) return;
    $('.pause-symbol', button).textContent = video.paused ? '▶' : 'Ⅱ';
    const text = $('.control-text', button);
    if (text) text.textContent = video.paused ? 'Reproducir' : 'Pausar';
    button.setAttribute('aria-label', video.paused ? 'Reproducir video' : 'Pausar video');
    button.setAttribute('aria-pressed', String(!video.paused));
    video.closest('.media-surface').classList.toggle('motion-paused', video.paused);
  }
  async function playVideo(video) {
    try { await video.play(); } catch { updateVideoControl(video); }
  }
  videos.forEach(video => {
    if (reducedMotion.matches || saveData) { video.removeAttribute('autoplay'); video.pause(); }
    ['play', 'pause', 'loadeddata', 'ended'].forEach(event => video.addEventListener(event, () => updateVideoControl(video)));
    video.addEventListener('error', () => {
      const label = $('.video-fallback', video.closest('.media-surface'));
      if (label) label.hidden = false;
      updateVideoControl(video);
    });
    updateVideoControl(video);
    $(`[data-video-toggle="${video.id}"]`).addEventListener('click', () => {
      if (video.paused) { manuallyPaused.delete(video.id); playVideo(video); }
      else { manuallyPaused.add(video.id); video.pause(); }
    });
  });
  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting && !manuallyPaused.has(video.id) && !reducedMotion.matches && !saveData && !document.hidden) playVideo(video);
      else if (!entry.isIntersecting) video.pause();
    }), { threshold: .25 });
    videos.forEach(video => videoObserver.observe(video));
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { if (!reducedMotion.matches) entry.target.classList.add('motion-enter'); revealObserver.unobserve(entry.target); } }), { threshold: .1 });
    $$('.section-heading, .workflow-heading, .savings-copy, .pilot-content').forEach(element => revealObserver.observe(element));
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach(video => video.pause()); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) videos.forEach(video => video.pause()); });

  const calcInputs = Object.fromEntries(['trips', 'minutes', 'days', 'rate'].map(key => [key, $(`#${key}`)]));
  let savingsScenario = null;
  function updateCalculator() {
    const values = Object.fromEntries(Object.entries(calcInputs).map(([key, input]) => [key, input.valueAsNumber]));
    const valid = Object.values(calcInputs).every(input => input.value !== '' && input.checkValidity() && Number.isFinite(input.valueAsNumber));
    ['trips', 'minutes'].forEach(key => { const input = calcInputs[key]; const fill = (input.valueAsNumber - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100; input.style.setProperty('--fill', `${fill}%`); });
    $('#trips-value').textContent = number.format(values.trips);
    $('#minutes-value').textContent = `${number.format(values.minutes)} min`;
    $('#calc-error').hidden = valid;
    if (!valid) {
      $('#calc-error').textContent = 'Usá entre 1 y 31 días y un costo evitable válido, igual o mayor a cero.';
      $('#savings-value').textContent = '—'; $('#hours-value').textContent = '—'; savingsScenario = null; return;
    }
    const hours = values.trips * values.minutes * values.days / 60;
    const savings = hours * values.rate;
    savingsScenario = { ...values, hours, savings };
    const formattedSavings = number.format(savings);
    $('#savings-value').textContent = formattedSavings;
    $('.money').classList.toggle('long-value', formattedSavings.length > 7);
    $('#hours-value').textContent = hoursNumber.format(hours);
    const path = savings === 0 ? 'M6 28H122' : 'M6 28 32 23 58 18 84 12 122 3';
    $('#savings-chart .chart-line').setAttribute('d', path);
    $('#savings-chart circle').setAttribute('cy', savings === 0 ? '28' : '3');
    $('#savings-chart').setAttribute('aria-label', `Escenario ilustrativo: USD ${number.format(savings)} de ahorro bruto potencial por mes. No es un resultado observado.`);
  }
  Object.values(calcInputs).forEach(input => input.addEventListener('input', updateCalculator));
  updateCalculator();

  const pilotPoint = $('#pilot-point');
  ['Punto de control de EPP', 'Zona restringida', 'Perímetro / depósito'].forEach(label => pilotPoint.add(new Option(label, label)));
  const pilotGoal = $('#pilot-goal');
  [['ppe','Supervisar EPP'],['access','Monitorear zonas restringidas'],['assets','Control patrimonial']].forEach(([value,label]) => pilotGoal.add(new Option(label, value)));
  const scopeCopy = {
    waits: 'Registrar llegadas, inicio de atención y salidas. Contrastar tiempos con registros manuales y evaluar un cambio de programación.',
    trips: 'Registrar vehículos, ingresos y salidas. Conciliar eventos con partes de servicio y registros de balanza para revisar diferencias.',
    fleet: 'Registrar llegadas, esperas y ciclos visibles. Evaluar cambios de programación manteniendo el volumen de operación.',
    ppe: 'Definir un punto de paso con visibilidad suficiente. Evaluar detección de casco y chaleco contra revisión humana, incluyendo eventos omitidos y falsas alertas.',
    access: 'Delimitar una zona y sus horarios. Registrar presencia de personas o vehículos y evaluar avisos con el responsable de seguridad. Si se requiere autorización individual, definir su integración con el control de accesos.',
    assets: 'Definir un perímetro o sector patrimonial y horarios autorizados. Revisar movimientos con evidencia visual y contrastarlos con los registros de la operación.'
  };
  pilotGoal.addEventListener('change', () => { $('#brief-preview p').textContent = scopeCopy[pilotGoal.value]; });
  let dialogTrigger = null;
  function openDialog(dialog, trigger) {
    closeMenu(); dialogTrigger = trigger;
    if (!dialog.open) dialog.showModal();
  }
  $$('[data-open-pilot]').forEach(button => button.addEventListener('click', () => {
    pilotGoal.value = button.classList.contains('calculator-cta') ? 'waits' : selectedGoal;
    pilotGoal.dispatchEvent(new Event('change'));
    $('#form-status').textContent = '';
    openDialog($('#pilot-dialog'), button);
  }));
  $$('[data-open-dialog]').forEach(button => button.addEventListener('click', () => openDialog(document.getElementById(button.dataset.openDialog), button)));
  $$('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { if (dialogTrigger && document.contains(dialogTrigger)) dialogTrigger.focus({ preventScroll: true }); });
  });
  $('#pilot-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const company = $('#company').value.trim();
    if (!company) { $('#company').setCustomValidity('Ingresá el nombre del proyecto.'); $('#company').reportValidity(); return; }
    const goal = pilotGoal.value;
    const lines = ['VOXXEL.AI — BRIEF INICIAL DE PILOTO', '', `Empresa / proyecto: ${company}`, `Punto a observar: ${pilotPoint.value}`, `Objetivo: ${pilotGoal.selectedOptions[0].textContent}`, '', 'ALCANCE PROPUESTO', scopeCopy[goal], '', 'DATOS PARA DEFINIR EL PILOTO', '- Responsable del proceso y del seguimiento.', '- Muestra autorizada de video y condiciones del punto de captura.', '- Registros actuales para contrastar los eventos.', '- Línea de base, criterio de éxito y plazo a acordar.', '- Requisitos de instalación, integración, privacidad y conservación de evidencia.', ''];
    if (goal === 'waits' && savingsScenario) {
      const s = savingsScenario;
      lines.push('ESCENARIO ILUSTRATIVO — NO ES UN RESULTADO OBSERVADO', `Viajes/día: ${s.trips}`, `Minutos a recuperar/viaje: ${s.minutes}`, `Días/mes: ${s.days}`, `Costo efectivamente evitable/hora: USD ${s.rate}`, `Horas potencialmente liberadas/mes: ${hoursNumber.format(s.hours)}`, `Ahorro bruto potencial/mes: USD ${number.format(s.savings)}`, 'Antes de software, cámaras, instalación y soporte. El resultado debe validarse en la operación.', '');
    }
    lines.push('Este brief se generó localmente. No fue enviado a Voxxel ni a terceros.');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'voxxel-brief-piloto.txt'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    $('#form-status').textContent = 'Brief generado. Podés compartir el archivo con tu equipo.';
  });
  $('#company').addEventListener('input', () => $('#company').setCustomValidity(''));
})();
