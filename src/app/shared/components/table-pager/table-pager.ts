import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { UiButton } from '../../elements/ui-button/ui-button';
import { UiSelect } from '../../elements/ui-select/ui-select';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-table-pager',
  imports: [UiIcon, UiButton, UiSelect],
  templateUrl: './table-pager.html',
  styleUrl: './table-pager.css',
})
export class TablePager {
  @Input() totalItems = 0;
  @Input() pageSize = environment.DEFAULT_PAGE_SIZE;
  @Input() currentPage = 1;

  @Output() onChange = new EventEmitter<{ page: number; pageSize: number }>();

  get rowsPerPage() {
    const rows = [];
    for (let i = 10; i <= 100; i += 10) {
      rows.push(i);
    }
    return rows;
  }

  get totalPages(): number {
    if (!this.pageSize) return 1;
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get visiblePages(): number[] {
    const start = Math.max(this.currentPage - 1, 2);
    const end = Math.min(this.currentPage + 1, this.totalPages - 1);

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  get showFirst(): boolean {
    return this.totalPages > 1;
  }

  get showLast(): boolean {
    return this.totalPages > 1;
  }

  get showLeftEllipsis(): boolean {
    return this.currentPage > 3;
  }

  get showRightEllipsis(): boolean {
    return this.currentPage < this.totalPages - 2;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.onChange.emit({ page, pageSize: this.pageSize });
  }

  changePageSize(obj: any) {
    this.pageSize = obj.value as number;
    this.onChange.emit({ page: this.currentPage, pageSize: this.pageSize });
  }
}
