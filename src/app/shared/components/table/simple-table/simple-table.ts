import { Component, ViewEncapsulation } from '@angular/core';

// Plantilla genérica de tabla. El encabezado (<th>) y las filas (<tr>) los
// aporta cada tabla específica con los atributos `tableHead` y `tableBody`.
@Component({
  selector: 'app-simple-table',
  templateUrl: './simple-table.html',
  styleUrl: './simple-table.css',
  // Los <th> llegan por proyección: el estilo debe aplicar fuera del scope del componente.
  encapsulation: ViewEncapsulation.None,
})
export class SimpleTable {}
