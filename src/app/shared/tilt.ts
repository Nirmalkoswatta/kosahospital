import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/** Pointer-driven 3D tilt. Skipped for touch and reduced-motion users. */
@Directive({ selector: '[appTilt]', host: { class: 'tilt' } })
export class Tilt {
  max = input(8, { alias: 'appTilt', transform: (v: unknown) => Number(v) || 8 });
  private el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  @HostListener('pointermove', ['$event'])
  move(e: PointerEvent) {
    if (this.calm || e.pointerType !== 'mouse') return;
    const r = this.el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    this.el.classList.add('tilting');
    this.el.style.setProperty('--ry', `${x * this.max() * 2}deg`);
    this.el.style.setProperty('--rx', `${-y * this.max() * 2}deg`);
  }

  @HostListener('pointerleave')
  leave() {
    this.el.classList.remove('tilting');
    this.el.style.setProperty('--rx', '0deg');
    this.el.style.setProperty('--ry', '0deg');
  }
}
