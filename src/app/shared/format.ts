import { Pipe, PipeTransform } from '@angular/core';

export const initials = (name = '') =>
  name.replace(/^Dr\.?\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

export const lkr = (n: number) => 'LKR ' + n.toLocaleString('en-LK', { maximumFractionDigits: 0 });

/** {{ name | initials }} */
@Pipe({ name: 'initials' })
export class InitialsPipe implements PipeTransform {
  transform = initials;
}

/** {{ amount | lkr }} */
@Pipe({ name: 'lkr' })
export class LkrPipe implements PipeTransform {
  transform = lkr;
}

export const ageFrom = (dob?: string) =>
  dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 86400000)) : undefined;
