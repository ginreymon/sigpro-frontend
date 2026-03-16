import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ellipsis',
})
export class EllipsisPipe implements PipeTransform {
  transform(value: string, limit: number = 30): unknown {
    if (!value) return '';

    if (value.length <= limit) return value;

    const truncated = value.substring(0, limit);

    return truncated.substring(0, truncated.lastIndexOf(' ')) + '...';
  }
}
