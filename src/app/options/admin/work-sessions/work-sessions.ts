import { Component, inject, OnInit, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiAlert } from '../../../shared/elements/ui-alert/ui-alert';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableColumn } from '../../../common/interfaces/table-column';
import { apiErrorDetail } from '../../../common/functions/api-error';
import { WorkSessionExplorerRow } from '../../../models/dashboard/work-session-explorer';
import { WorkSessionExplorerService } from '../../../services/dashboard/work-session-explorer-service';
import { LoaderService } from '../../../services/common/loader-service';
import { environment } from '../../../../environments/environment';
import { SessionDetail } from './session-detail/session-detail';

// /admin/work-sessions: latest work sessions in a searchable table (the search box matches OP type and
// number, reference and module; the columns use the table's default column filter). The view action opens the
// session to review and edit it.
@Component({
  selector: 'app-work-sessions',
  imports: [WorkSpaceLayout, DataTable, UiAlert, SessionDetail],
  templateUrl: './work-sessions.html',
})
export class WorkSessions implements OnInit {
  private service = inject(WorkSessionExplorerService);
  private loader = inject(LoaderService);

  protected readonly columns: TableColumn<WorkSessionExplorerRow>[] = [
    { field: 'id', label: 'Sesión' },
    { field: 'started_at', label: 'Inicio', type: 'date' },
    { field: 'ended_at', label: 'Fin', type: 'date' },
    { field: 'area_name', label: 'Área' },
    { field: 'module_name', label: 'Módulo' },
    { field: 'op_type', label: 'Tipo' },
    { field: 'op_number', label: 'OP' },
    { field: 'reference', label: 'Referencia' },
    { field: 'is_closed', label: 'Cerrada', type: 'boolean' },
  ];

  protected sessions = signal<PaginatedResponse<WorkSessionExplorerRow> | null>(null);
  protected selected = signal<WorkSessionExplorerRow | null>(null);
  protected errorMessage = signal('');

  private term = '';
  private offset = 0;
  private limit = environment.DEFAULT_PAGE_SIZE;

  ngOnInit(): void {
    this.load();
  }

  // A new search always goes back to the first page.
  search(term: string): void {
    this.term = term.trim();
    this.offset = 0;
    this.load();
  }

  pagerHandler({ page, pageSize }: { page: number; pageSize: number }): void {
    this.limit = pageSize;
    this.offset = (page - 1) * pageSize;
    this.load();
  }

  actionHandler(event: TableActionEvent<WorkSessionExplorerRow>): void {
    if (event.type === 'view') this.selected.set(event.obj);
  }

  // Back from the detail: reload so the table shows what was edited.
  closeDetail(): void {
    this.selected.set(null);
    this.load();
  }

  private load(): void {
    this.errorMessage.set('');
    this.loader.showLoader();
    this.service
      .getAll({
        limit: this.limit,
        offset: this.offset,
        filters: {
          search: this.term || null,
        },
      })
      .subscribe({
        next: (res) => {
          this.sessions.set(res);
          this.loader.hideLoader();
        },
        error: (err) => {
          this.errorMessage.set(apiErrorDetail(err, 'No se pudieron consultar las sesiones. Intenta de nuevo.'));
          this.loader.hideLoader();
        },
      });
  }
}
