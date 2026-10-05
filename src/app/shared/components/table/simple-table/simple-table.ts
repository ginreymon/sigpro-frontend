import { Component } from '@angular/core';

// Plantilla genérica de tabla. El encabezado (<th>) y las filas (<tr>) los
// aporta cada tabla específica con los atributos `tableHead` y `tableBody`.
@Component({
  selector: 'app-simple-table',
  templateUrl: './simple-table.html',
})
export class SimpleTable {}
