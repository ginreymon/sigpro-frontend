import { Component } from '@angular/core';
import { MessageTemplate } from '../message-template/message-template';
import { WorkSpaceLayout } from '../../layouts/work-space-layout/work-space-layout';

@Component({
  selector: 'app-route-unavailable',
  imports: [MessageTemplate, WorkSpaceLayout],
  templateUrl: './route-unavailable.html',
})
export class RouteUnavailable {
  readonly title = 'Estamos ajustando algunas funcionalidades';
  readonly description = 'Esta sección no está disponible en este momento. Si necesitas habilitar el acceso, contacta al administrador del sistema.';
  readonly illustrationIcon = 'settings';
  readonly badgeIcon = 'triangleExclamation';
  readonly badgeLabel = 'Ruta no disponible';
}
