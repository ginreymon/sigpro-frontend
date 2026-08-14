import { Component, Input } from '@angular/core';

export interface InfoPanelLine {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-ui-info-panel',
  imports: [],
  templateUrl: './ui-info-panel.html',
  styleUrl: './ui-info-panel.css',
})
export class UiInfoPanel {
  @Input() lines: InfoPanelLine[] = [];
  // 'row': una línea, lado a lado (ej. Tiempo total en work-shifts).
  // 'column': varias líneas apiladas (ej. Referencia/Línea en sewing-sam).
  @Input() align: 'row' | 'column' = 'row';
  // false (default): label plano/itálica, value en negrita/color primario (comportamiento histórico).
  // true: invierte esos estilos entre label y value.
  @Input() invertStyles: boolean = false;
}
