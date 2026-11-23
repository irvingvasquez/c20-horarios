// =====================================================================
//  c20-pdf.js — Genera el Formato C-20 (IPN) como HTML imprimible.
//  Sin dependencias. Funciona en cualquier framework (o sin framework).
//
//  Uso:
//    import { printC20, buildC20Html } from "./c20-pdf.js";
//    printC20(datosJson);            // abre el diálogo de impresión -> "Guardar como PDF"
//    const html = buildC20Html(datosJson);   // HTML completo, por si quieres previsualizar
// =====================================================================

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes"];
const NORMALIZA_DIA = { "miércoles": "miercoles" };

// ---------------------------------------------------------- utilidades
const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const aMin = (hhmm) => {
  const [h, m] = hhmm.trim().split(":").map(Number);
  return h * 60 + m;
};
const aHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fmtHoras = (h) => String(Math.round(h * 100) / 100);

function fmtFecha(iso) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso; // dd/mm/aaaa
}

function fusionar(intervalos) {
  const res = [];
  for (const [i, f] of [...intervalos].sort((a, b) => a[0] - b[0])) {
    const ult = res[res.length - 1];
    if (ult && i <= ult[1]) ult[1] = Math.max(ult[1], f);
    else res.push([i, f]);
  }
  return res;
}

// ------------------------------------------- horario -> filas de la tabla
export function construirFilas(datos) {
  const programas = new Map((datos.programs ?? []).map((p) => [p.id, p]));
  const nombres = new Map();
  for (const s of datos.subjects ?? []) {
    const p = programas.get(s.programId);
    nombres.set(`s${s.id}`, s.name.trim() + (p?.acronym ? ` (${p.acronym})` : ""));
  }
  for (const a of datos.activities ?? []) nombres.set(`a${a.id}`, a.name.trim());

  const bloques = new Map(); // clave -> {dia: [[ini, fin]]}
  const horas = new Map();
  for (const b of datos.schedule ?? []) {
    const clave = b.subjectId != null ? `s${b.subjectId}` : b.activityId != null ? `a${b.activityId}` : null;
    if (!clave || !nombres.has(clave)) continue;
    let dia = String(b.day).toLowerCase().trim();
    dia = NORMALIZA_DIA[dia] ?? dia;
    if (!DIAS.includes(dia)) continue;
    if (!b.startTime || !String(b.startTime).trim()) continue;
    const ini = aMin(b.startTime);
    const fin = ini + Math.round(Number(b.hours) * 60);
    if (!bloques.has(clave)) bloques.set(clave, {});
    (bloques.get(clave)[dia] ??= []).push([ini, fin]);
    horas.set(clave, (horas.get(clave) ?? 0) + Number(b.hours));
  }

  return [...bloques.keys()]
    .sort((a, b) => nombres.get(a).localeCompare(nombres.get(b), "es"))
    .map((clave) => ({
      nombre: nombres.get(clave),
      dias: DIAS.map((d) =>
        fusionar(bloques.get(clave)[d] ?? []).map(([i, f]) => `${aHHMM(i)} - ${aHHMM(f)}`).join(", ")),
      horas: horas.get(clave),
    }));
}

// ------------------------------------------------------------- estilos
const CSS = `
@page { size: letter landscape; margin: 10mm 10mm 8mm 10mm; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 8pt;
       -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.hoja { width: 259mm; height: 196mm; display: flex; gap: 4mm; overflow: hidden; }
.principal { width: 206mm; }
.separador { width: 1.6mm; border-left: 0.6pt solid #000; border-right: 0.6pt solid #000; }
.lateral { flex: 1; font-size: 7pt; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; }
td, th { padding: 0.6mm 1mm; vertical-align: middle; font-weight: normal; }
.lbl { font-size: 5.5pt; text-transform: uppercase; }
.val { font-size: 8.5pt; }
.c { text-align: center; } .r { text-align: right; }
.b { border: 0.6pt solid #000; } .bt { border-top: 0.6pt solid #000; }
.bb { border-bottom: 0.6pt solid #000; } .bl { border-left: 0.6pt solid #000; }
.br { border-right: 0.6pt solid #000; }

/* encabezado */
.encabezado { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5mm; }
.titulo { font-weight: bold; font-size: 9.5pt; line-height: 1.2; }
.escuela td { padding: 0.4mm 1mm; font-size: 7pt; }
.escuela td.lbl { text-align: right; width: 16mm; }
.escuela td.v { border-bottom: 0.6pt solid #000; width: 92mm; }

/* datos generales */
.datos { border: 0.8pt solid #000; }
.datos td { height: 4.6mm; }
.circ { display: inline-block; width: 2.6mm; height: 2.6mm; border-radius: 50%;
        border: 0.6pt solid #000; vertical-align: middle; float: right; margin-top: 0.3mm; }
.circ.on { background: #000; }

/* actividades */
.seccion { font-size: 8.5pt; margin: 3.5mm 0 1mm; }
.act td, .act th { border: 0.6pt solid #000; height: 5.2mm; }
.act td.n { font-size: 8pt; }
.act td.h { font-size: 6.3pt; text-align: center; line-height: 1.15; }

/* pie */
.caja { border: 1pt solid #000; padding: 1.2mm 2mm; }
.pie1 { display: flex; justify-content: space-between; margin-top: 5mm; }
.pie1 .caja { width: 70mm; font-size: 7.5pt; }
.obs { margin-top: 2.5mm; display: flex; }
.obs .lbl { width: 22mm; border-right: 0.6pt solid #000; padding-right: 1mm; }
.firmas { display: flex; justify-content: space-around; margin-top: 17mm; }
.firma { width: 58mm; text-align: center; font-size: 6pt; line-height: 1.6; }
.firma .linea { border-top: 0.7pt solid #000; margin-bottom: 0.8mm; }

/* panel lateral */
.lateral .t { line-height: 1.6; margin-bottom: 2mm; }
.codigos td { border: 0.5pt solid #000; height: 3.6mm; padding: 0 1mm; font-size: 5.8pt; }
.codigos td.cod { text-align: center; }
.hueco td { border: none; height: 3mm; }

@media screen {
  body { background: #888; padding: 10mm; }
  .hoja { background: #fff; padding: 10mm; width: 279mm; height: 216mm; margin: auto;
          box-shadow: 0 2px 10px rgba(0,0,0,.4); }
}
`;

// ------------------------------------------------------- HTML del formato
export function buildC20Html(datos, { filasMinimas = 11 } = {}) {
  const f = datos.formato ?? {};
  const d = f.docente ?? {};
  const fi = f.firmas ?? {};
  const cond = (d.condicionAdscripcion ?? "").toLowerCase();
  const filas = construirFilas(datos);
  const total = filas.reduce((s, r) => s + r.horas, 0);

  const circulo = (on) => `<span class="circ${on ? " on" : ""}"></span>`;

  const filasAct = filas.map((r) => `
    <tr><td class="n">${esc(r.nombre)}</td>
      ${r.dias.map((x) => `<td class="h">${esc(x)}</td>`).join("")}
      <td class="h">${fmtHoras(r.horas)}</td></tr>`).join("");
  const vacias = Array.from({ length: Math.max(0, filasMinimas - filas.length) },
    () => `<tr>${"<td></td>".repeat(7)}</tr>`).join("");

  const izq = ["1.1","1.2","1.3","1.4","1.5","ST","2.1","ST","3.1","3.2","ST",null,
               "4.1","4.2","4.3","4.4","4.5","4.6","4.7","ST",""];
  const der = ["5.1","5.2","5.3","5.4","5","5.6","5.7","5.8","5.9","5.1","5.11",null,
               "5.12","5.13","ST","6.1","ST","7.1","ST","8.1","ST"];
  const codigos = izq.map((a, i) => a === null
    ? `<tr class="hueco"><td colspan="4"></td></tr>`
    : `<tr><td class="cod">${a}</td><td></td><td></td><td class="cod">${der[i]}</td></tr>`).join("");

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<title>Formato C-20 ${esc(d.apellidoPaterno)} ${esc(d.nombres)}</title>
<style>${CSS}</style></head>
<body><div class="hoja">
<div class="principal">

  <div class="encabezado">
    <div class="titulo">INSTITUTO POLITECNICO NACIONAL<br>SECRETARIA ACADEMICA</div>
    <table class="escuela" style="width:auto">
      <tr><td class="lbl">Escuela</td><td class="v">${esc(f.escuela)}</td></tr>
      <tr><td class="lbl">Clave U.R.</td><td class="v">${esc(f.claveUR)}</td></tr>
      <tr><td class="lbl">Periodo</td><td class="v">${esc(f.periodo)}</td></tr>
    </table>
  </div>

  <table class="datos">
    <colgroup><col style="width:12%"><col style="width:11%"><col style="width:12%">
      <col style="width:13%"><col style="width:12%"><col style="width:24%">
      <col style="width:8%"><col style="width:8%"></colgroup>
    <tr><td class="lbl">Nombre completo</td><td class="lbl" colspan="2">Apellido paterno</td>
        <td class="lbl">Materno</td><td class="lbl r br">Nombre (s)</td>
        <td class="lbl" colspan="3">R.F.C.</td></tr>
    <tr class="bb"><td></td><td class="val c" colspan="2">${esc(d.apellidoPaterno)}</td>
        <td class="val">${esc(d.apellidoMaterno)}</td><td class="val br">${esc(d.nombres)}</td>
        <td class="val c" colspan="3">${esc(d.rfc)}</td></tr>
    <tr><td class="lbl br" colspan="3">Grado máximo de estudios</td>
        <td class="lbl br" colspan="2">Egresado de</td><td class="lbl" colspan="3">Especialidad</td></tr>
    <tr class="bb"><td class="val c br" colspan="3">${esc(d.gradoMaximo)}</td>
        <td class="val c br" colspan="2">${esc(d.egresadoDe)}</td>
        <td class="val" colspan="3">${esc(d.especialidad)}</td></tr>
    <tr><td class="lbl br" colspan="5">Departamento o academia</td>
        <td class="lbl" colspan="3">No. de empleado</td></tr>
    <tr class="bb"><td class="val br" colspan="5" style="padding-left:12mm">${esc(d.departamento)}</td>
        <td class="val" colspan="3" style="padding-left:6mm">${esc(d.numeroEmpleado)}</td></tr>
    <tr><td class="lbl br">Condiciones de</td><td class="lbl br">Fecha de ing.</td>
        <td class="lbl br">No. horas de</td><td class="lbl bb" colspan="3">Categoria</td>
        <td class="lbl c bb bl" colspan="2">Jornada de trabajo</td></tr>
    <tr class="bb"><td class="lbl br">Adscripcion</td><td class="lbl br">al I.P.N.</td>
        <td class="lbl br">Nombramiento</td>
        <td class="c br" colspan="2" style="font-size:7.5pt">${esc(d.categoria)}</td><td class="br"></td>
        <td class="lbl c br">Matutino</td><td class="lbl c">Vespertino</td></tr>
    <tr><td class="lbl br">Base ${circulo(cond === "base")}</td><td class="br"></td><td class="br"></td>
        <td class="br bb" colspan="2"></td><td class="br bb"></td><td class="br bb"></td><td class="bb"></td></tr>
    <tr><td class="lbl br">Interinato ${circulo(cond === "interinato")}</td>
        <td class="val c br">${esc(fmtFecha(d.fechaIngresoIPN))}</td>
        <td class="val c br">${esc(d.horasNombramiento ?? "")}</td>
        <td class="br bb" colspan="2"></td><td class="br bb"></td>
        <td class="val c br bb">${d.jornada?.matutino ? "X" : ""}</td>
        <td class="val c bb">${d.jornada?.vespertino ? "X" : ""}</td></tr>
    <tr><td class="lbl br">Otro ${cond === "otro" ? `<span style="text-transform:none">${esc(d.condicionOtro)}</span> ${circulo(true)}` : ""}</td>
        <td class="br"></td><td class="br"></td><td class="br" colspan="2"></td>
        <td class="br"></td><td class="br"></td><td></td></tr>
  </table>

  <div class="seccion">I.- DESCRIPCIÓN DE ACTIVIDADES QUE DESEMPEÑA</div>
  <table class="act">
    <colgroup><col style="width:34%"><col span="5" style="width:10%"><col style="width:16%"></colgroup>
    <tr><th></th><th colspan="5" style="font-weight:bold;letter-spacing:1.5pt;font-size:7pt">HORARIO</th>
        <th class="lbl">Total</th></tr>
    <tr><th></th><th class="lbl">Lunes</th><th class="lbl">Martes</th><th class="lbl">Miercoles</th>
        <th class="lbl">Jueves</th><th class="lbl">Viernes</th><th class="lbl">Horas</th></tr>
    ${filasAct}${vacias}
    <tr><td></td><td></td><td></td><td></td><td></td><td></td><td class="h">${fmtHoras(total)}</td></tr>
  </table>

  <div class="pie1">
    <div class="caja"><span class="lbl">Fecha de llenado:</span>&nbsp;&nbsp;&nbsp; ${esc(fmtFecha(f.fechaLlenado))}</div>
    <div class="caja c">VIGENCIA: ${esc(f.vigencia)}</div>
  </div>
  <div class="caja obs"><span class="lbl">Observaciones:</span><span style="padding-left:2mm">${esc(f.observaciones)}</span></div>

  <div class="firmas">
    ${[fi.profesor, fi.subdirector, fi.director].map((p, i) => `
      <div class="firma"><div class="linea"></div>${esc(p?.nombre)}<br>
        ${esc(p?.cargo ?? ["PROFESOR", "SUBDIRECTOR ACADÉMICO", "DIRECTOR"][i])}</div>`).join("")}
  </div>
</div>

<div class="separador"></div>

<div class="lateral">
  <div class="t">PARA USO EXCLUSIVO<br>DE LA<br><br>SECRETARIA ACADEMICA</div>
  <table class="codigos">
    <colgroup><col style="width:22%"><col style="width:32%"><col style="width:26%"><col style="width:20%"></colgroup>
    ${codigos}
  </table>
  <table class="codigos" style="margin-top:2mm">
    <colgroup><col style="width:22%"><col style="width:32%"><col span="3" style="width:8.6%"></colgroup>
    <tr><td style="border:none" colspan="5">TOTAL</td></tr>
    <tr><td class="cod">REG.</td><td class="cod">EFEC.</td><td class="cod">S</td><td class="cod">N</td><td class="cod">P</td></tr>
    <tr><td></td><td></td><td></td><td></td><td></td></tr>
    <tr><td style="border:none"></td><td class="cod" style="border-top:none">TOTAL</td><td colspan="3" style="border:none"></td></tr>
  </table>
</div>
</div></body></html>`;
}

// ------------------------------------------------- imprimir / guardar PDF
export function printC20(datos, opciones) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();          // el usuario elige "Guardar como PDF"
    setTimeout(() => iframe.remove(), 60_000);
  };
  iframe.srcdoc = buildC20Html(datos, opciones);
  document.body.appendChild(iframe);
}
