import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SOItems } from '../../shared/models/SOItems';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { Stores } from '../../shared/models/Stores';
import { CentersService } from '../../shared/services/centers.service';
import { StoresService } from '../../shared/services/stores.service';
import { Items } from '../../shared/models/Items';
import { ItemsService } from '../../shared/services/items.service';
import { ItemsSearchComponent } from '../items/items-search.component';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-so-items-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ItemsSearchComponent],
  templateUrl: './so-items-form.component.html',
})
export class SOItemsFormComponent {
  private toastService = inject(ToastService);

  @Input() soItem: Partial<SOItems> | null = null;
  @Input() serviceOrderId?: number;
  @Input() centerId?: number;
  @Input() storeId?: number;
  @Input() createdById?: number;
  @Input() isModal: boolean = false;
  @Output() save = new EventEmitter<Partial<SOItems>>();
  @Output() cancel = new EventEmitter<void>();

  showItemSearch = false;

  form: FormGroup;

  // Data for selects
    centers: Centers[] = [];
    stores: Stores[] = [];
    items: Items[] = [];

  constructor(private fb: FormBuilder, private centerService: CentersService,
      private storeService: StoresService, private itemsService: ItemsService) {
    this.form = this.fb.group({
      centerId: [null, Validators.required],
      storeId: [null, Validators.required],
      serviceOrderId: [null, Validators.required],
      itemId: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      cost: [0, Validators.required],
      price: [0, Validators.required],
      discount: [0],
      note: [''],
    });
  }

  ngOnChanges() {
    console.log('SO-Items ngOnChanges - serviceOrderId recibido:', this.serviceOrderId);
    console.log('SO-Items ngOnChanges - centerId:', this.centerId, 'storeId:', this.storeId);
    
    if (this.soItem) {
      this.form.patchValue(this.soItem as any);
    }

    // Always update these fields from inputs, even if form already has a value
    if (this.serviceOrderId) {
      this.form.patchValue({ serviceOrderId: Number(this.serviceOrderId) });
      console.log('serviceOrderId asignado al formulario:', Number(this.serviceOrderId));
    } else {
      console.warn('serviceOrderId no disponible');
    }
    if (this.centerId) {
      this.form.patchValue({ centerId: Number(this.centerId) });
    }
    if (this.storeId) {
      this.form.patchValue({ storeId: Number(this.storeId) });
    }
  }

  ngOnInit(): void {  
    
    
    this.centerService.getAll().subscribe((c) => (this.centers = c));
    this.storeService.getAll().subscribe((s) => (this.stores = s));
    this.itemsService.getAll().subscribe((i) => (this.items = i));

    // Cuando cambia el center, limpiar storeId
    this.form.get('centerId')?.valueChanges.subscribe(() => {
      this.form.get('storeId')?.setValue(null);
    });

    this.form.get('itemId')?.valueChanges.subscribe((itemId) => {
      this.applyItemDefaults(itemId);
    });

  }

  get filteredStores() {
    const rawCenter = this.form.get('centerId')?.value;
    const centerId = rawCenter !== null && rawCenter !== undefined ? Number(rawCenter) : null;
    if (!centerId) return [];

    return this.stores.filter(store => {
      const s: any = store as any;
      const sCenter = s.centerid ?? s.centerId ?? s.center;
      return Number(sCenter) === centerId;
    });
  }

  get filteredItems() {
    const rawCenter = this.form.get('centerId')?.value;
    const rawStore = this.form.get('storeId')?.value;
    const centerId = rawCenter !== null && rawCenter !== undefined ? Number(rawCenter) : null;
    const storeId = rawStore !== null && rawStore !== undefined ? Number(rawStore) : null;

    if (!centerId && !storeId) return this.items;

    return this.items.filter(item => {
      const i: any = item as any;
      const iCenter = i.centerid ?? i.centerId ?? i.center;
      const iStore = i.storeid ?? i.storeId ?? i.store;

      if (storeId) {
        return Number(iStore) === storeId;
      }

      return Number(iCenter) === centerId;
    });
  }

  onSubmit() {
    // Validar que existe el serviceOrderId
    if (!this.serviceOrderId) {
      this.toastService.error('Debe guardar la orden de servicio antes de agregar items.');
      return;
    }
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Por favor complete todos los campos requeridos.');
      return;
    }
    
    // Preparar payload según DTO del backend (sin createdById, con conversión de tipos)
    const formValue = this.form.value;
    
    // Validar que itemId sea un número válido
    const itemId = Number(formValue.itemId);
    if (!itemId || isNaN(itemId)) {
      this.toastService.error('Debe seleccionar un item válido.');
      return;
    }
    
    const payload = {
      centerId: Number(formValue.centerId),
      storeId: Number(formValue.storeId),
      serviceOrderId: Number(formValue.serviceOrderId),
      itemId: itemId,
      quantity: Number(formValue.quantity) || 1,
      cost: Number(formValue.cost) || 0,
      price: Number(formValue.price) || 0,
      discount: Number(formValue.discount) || 0,
      note: formValue.note || '',
      createdById: this.createdById != null ? Number(this.createdById) : undefined
    };
    
    this.save.emit(payload);
  }

  openItemSearch() {
    this.showItemSearch = true;
  }

  closeItemSearch() {
    this.showItemSearch = false;
  }

  onItemSelected(item: Items) {
    // Reload items list to include the newly created item
    this.itemsService.getAll().subscribe((i) => {
      this.items = i;
      this.form.patchValue({
        itemId: item.id,
        cost: item.cost ?? 0,
        price: item.price ?? 0,
        discount: item.discount ?? 0,
        note: item.shortTitleDesc || item.product || ''
      });
      this.closeItemSearch();
    });
  }

  private applyItemDefaults(itemId: number | null) {
    if (!itemId) return;
    console.log('applyItemDefaults llamado con itemId:', itemId, 'tipo:', typeof itemId);
    const selected = this.items.find(i => Number(i.id) === Number(itemId));
    if (!selected) {
      console.warn('No se encontró item con id:', itemId);
      return;
    }

    console.log('Item encontrado:', selected);
    this.form.patchValue({
      cost: selected.cost ?? 0,
      price: selected.price ?? 0,
      discount: selected.discount ?? 0,
      note: selected.shortTitleDesc || selected.product || ''
    }, { emitEvent: false });
  }
}
