// Menú en móvil
const boton = document.querySelector('.menu-boton');
const menu = document.getElementById('menu');
if (boton && menu) {
  boton.addEventListener('click', () => {
    const abierto = menu.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.textContent = abierto ? 'Cerrar' : 'Menú';
  });
}

// Filtro de proyectos por tipo
const filtros = document.querySelectorAll('.filtros button');
const rejilla = document.querySelector('.obras-todas');
filtros.forEach((b) => {
  b.addEventListener('click', () => {
    const tipo = b.dataset.filtro;
    filtros.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    rejilla.classList.toggle('filtrada', Boolean(tipo));
    rejilla.querySelectorAll('.obra').forEach((o) => {
      o.hidden = Boolean(tipo) && o.dataset.tipo !== tipo;
    });
  });
});
