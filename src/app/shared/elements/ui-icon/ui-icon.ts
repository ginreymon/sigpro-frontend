import { Component, Input, OnInit } from '@angular/core';
import { iconMap } from '../../../common/const/icon-map';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-ui-icon',
  imports: [],
  templateUrl: './ui-icon.html',
  styleUrl: './ui-icon.css',
})
export class UiIcon implements OnInit {
  @Input() iconName: string = '';
  @Input() class: string = '';

  svg!: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {}
  ngOnInit(): void {
    let raw = iconMap[this.iconName] || '';
    raw = raw.replace('<svg', `<svg class="${this.class}"`);

    this.svg = this.sanitizer.bypassSecurityTrustHtml(raw);
  }
}
