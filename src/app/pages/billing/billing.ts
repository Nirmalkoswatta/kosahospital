import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Invoice, InvoiceItem, invoiceTotal } from '../../core/models';
import { NotificationService } from '../../core/notification.service';
import { Store } from '../../core/store';
import { LkrPipe } from '../../shared/format';

@Component({
  selector: 'app-billing',
  imports: [FormsModule, LkrPipe],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ isPatient() ? 'My bills' : 'Billing' }}</h1>
        <p>{{ isPatient() ? 'Consultations and tests billed to you.' : 'Invoices across the hospital.' }}</p>
      </div>
      @if (isStaff()) {
        <button class="btn" type="button" (click)="creating.set(!creating())" [attr.aria-expanded]="creating()">
          <span class="mi" aria-hidden="true">{{ creating() ? 'close' : 'add' }}</span>{{ creating() ? 'Close' : 'New invoice' }}
        </button>
      }
    </div>

    <div class="grid cols-3 sums">
      <div class="card stat rise"><span class="ico warn"><span class="mi" aria-hidden="true">pending</span></span><div><div class="value">{{ sum('unpaid') | lkr }}</div><div class="label">Outstanding</div></div></div>
      <div class="card stat rise" style="--i: 1"><span class="ico ok"><span class="mi" aria-hidden="true">check_circle</span></span><div><div class="value">{{ sum('paid') | lkr }}</div><div class="label">Paid</div></div></div>
      <div class="card stat rise" style="--i: 2"><span class="ico"><span class="mi" aria-hidden="true">receipt_long</span></span><div><div class="value">{{ mine().length }}</div><div class="label">Invoices</div></div></div>
    </div>

    @if (creating()) {
      <form class="card rise new" (ngSubmit)="create()">
        <h2>New invoice</h2>
        <label class="field"><span>Patient</span>
          <select class="input" name="pt" required [(ngModel)]="patientId">
            <option value="" disabled>Choose patient</option>
            @for (p of store.patients(); track p.id) { <option [value]="p.id">{{ p.name }} — {{ p.email }}</option> }
          </select>
        </label>
        @for (it of items; track $index; let i = $index) {
          <div class="line">
            <label class="field"><span>Item</span><input class="input" [name]="'l' + i" placeholder="e.g. X-ray chest" [(ngModel)]="it.label" /></label>
            <label class="field"><span>Amount (LKR)</span><input class="input" type="number" min="0" [name]="'a' + i" [(ngModel)]="it.amount" /></label>
            <button type="button" class="icon-btn" [disabled]="items.length === 1" (click)="items.splice(i, 1)" aria-label="Remove line"><span class="mi" aria-hidden="true">delete</span></button>
          </div>
        }
        <div class="row">
          <button type="button" class="btn soft sm" (click)="items.push({ label: '', amount: 0 })"><span class="mi" aria-hidden="true">add</span>Line</button>
          <span class="grow"></span>
          <strong>Total {{ draftTotal() | lkr }}</strong>
          <button class="btn" type="submit">Create invoice</button>
        </div>
      </form>
    }

    <div class="card">
      <div class="row head">
        <div class="tabs" role="group" aria-label="Status">
          @for (t of tabs; track t) { <button type="button" [attr.aria-pressed]="tab() === t" (click)="tab.set(t)">{{ t }}</button> }
        </div>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>Date</th>@if (!isPatient()) { <th>Patient</th> }<th>Items</th><th>Total</th><th>Status</th><th><span class="sr-only">Action</span></th></tr></thead>
          <tbody>
            @for (b of shown(); track b.id; let i = $index) {
              <tr class="rise" [style.--i]="i">
                <td>{{ b.createdAt.slice(0, 10) }}</td>
                @if (!isPatient()) { <td>{{ store.user(b.patientId)?.name }}</td> }
                <td>@for (it of b.items; track $index) { <div class="small">{{ it.label }} <span class="muted">· {{ it.amount | lkr }}</span></div> }</td>
                <td><strong>{{ total(b) | lkr }}</strong></td>
                <td><span class="badge" [class]="'badge ' + b.status">{{ b.status }}</span></td>
                <td>
                  @if (b.status === 'unpaid' && (isPatient() || isStaff())) {
                    <button class="btn sm success" type="button" (click)="pay(b)">{{ isPatient() ? 'Pay now' : 'Mark paid' }}</button>
                  } @else if (b.paidAt) {
                    <span class="small muted">Paid {{ b.paidAt.slice(0, 10) }}</span>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No invoices.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: `
    .sums { margin-bottom: 1rem; }
    .ico.warn { background: var(--warn-soft); color: var(--warn); } .ico.ok { background: var(--success-soft); color: var(--success); }
    .new { margin-bottom: 1rem; display: grid; gap: 0.75rem; }
    .line { display: grid; grid-template-columns: 2fr 1fr 44px; gap: 0.5rem; align-items: end; }
    .head { margin-bottom: 1rem; }
    .tabs button { text-transform: capitalize; }
  `,
})
export class Billing {
  store = inject(Store);
  private ns = inject(NotificationService);
  isPatient = computed(() => this.store.me()?.role === 'patient');
  isStaff = computed(() => this.store.me()?.role === 'staff');
  tabs = ['all', 'unpaid', 'paid'] as const;
  tab = signal<(typeof this.tabs)[number]>('all');
  creating = signal(false);
  patientId = '';
  items: InvoiceItem[] = [{ label: '', amount: 0 }];
  total = invoiceTotal;

  mine = computed(() => {
    const me = this.store.me()!;
    return this.store.invoices().filter((i) => !this.isPatient() || i.patientId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });
  shown = computed(() => this.mine().filter((i) => this.tab() === 'all' || i.status === this.tab()));
  sum = (s: Invoice['status']) => this.mine().filter((i) => i.status === s).reduce((t, i) => t + invoiceTotal(i), 0);
  draftTotal = () => this.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  // shortcut: "Pay now" just marks the invoice paid; wire a payment gateway (e.g. PayHere) before real use.
  pay(b: Invoice) {
    this.store.payInvoice(b.id);
    this.ns.success(`${invoiceTotal(b).toLocaleString()} LKR received`, 'Payment recorded');
  }

  create() {
    if (!this.patientId) return this.ns.warn('Choose a patient.');
    const items = this.items.map((i) => ({ label: i.label.trim(), amount: Number(i.amount) }));
    if (this.ns.attempt(() => this.store.addInvoice(this.patientId, items), 'Invoice created')) {
      this.items = [{ label: '', amount: 0 }];
      this.patientId = '';
      this.creating.set(false);
    }
  }
}
