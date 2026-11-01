import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { TableTemplate } from '../../../directives/table-template';
import { DataTable } from '../../../shared/components/table/data-table/data-table';
import { UiAlert } from '../../../shared/elements/ui-alert/ui-alert';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { TableActions } from '../../../common/interfaces/table-actions';
import { TableColumn } from '../../../common/interfaces/table-column';
import { apiErrorDetail } from '../../../common/functions/api-error';
import { WorkSessionExplorerRow } from '../../../models/dashboard/work-session-explorer';
import { WorkSessionExplorerService } from '../../../services/dashboard/work-session-explorer-service';
import { LoaderService } from '../../../services/common/loader-service';
import { DialogService } from '../../../services/common/dialog-service';
import { SideModalLayout } from '../../../shared/components/layout/side-modal-layout/side-modal-layout';
import { environment } from '../../../../environments/environment';
import { SessionDetail } from './session-detail/session-detail';

// /admin/work-sessions: latest work sessions in a searchable table (the search box matches OP type and
// number, reference and module; the columns use the table's default column filter). The view action opens the
// read-only session detail.
@Component({
  selector: 'app-work-sessions',
  imports: [WorkSpaceLayout, DataTable, UiAlert, UiBadge, SessionDetail, SideModalLayout, TableTemplate, DatePipe],
  templateUrl: './work-sessions.html',
})
export class WorkSessions implements OnInit {
  private service = inject(WorkSessionExplorerService);
  private loader = inject(LoaderService);
  private dialogService = inject(DialogService);

  protected readonly columns: TableColumn<WorkSessionExplorerRow>[] = [
    { field: 'started_at', type: 'template', label: 'Fecha', templateName: 'startedAtTemplate' },
    { field: 'is_closed', type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    { field: 'area_name', label: 'Área' },
    { field: 'module_name', label: 'Módulo' },
    { field: 'op', label: 'OP' },
    { field: 'reference', label: 'Referencia' },
  ];

  protected readonly actions: TableActions = {
    view: { enabled: true, title: 'Ver detalle de la sesión', iconName: 'eye', toolTip: 'Ver' },
    edit: { enabled: false },
    delete: { enabled: false },
    create: { enabled: false },
  };

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
    if (event.type !== 'view') return;
    this.selected.set(event.obj);
    this.dialogService.openSideModal(`Sesión #${event.obj.id}`);
  }

  closeDetail(): void {
    this.selected.set(null);
    this.dialogService.closeModal();
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
          this.sessions.set({
            ...res,
            results: res.results.map((row) => ({
              ...row,
              op: [row.op_type?.trim(), row.op_number].filter((part) => part != null && part !== '').join(' '),
            })),
          });
          this.loader.hideLoader();
        },
        error: (err) => {
          this.errorMessage.set(apiErrorDetail(err, 'No se pudieron consultar las sesiones. Intenta de nuevo.'));
          this.loader.hideLoader();
        },
      });
  }
}
