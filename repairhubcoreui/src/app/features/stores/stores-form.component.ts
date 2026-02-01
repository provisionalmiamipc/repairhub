import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Stores } from '../../shared/models/Stores';
import { CommonModule } from '@angular/common';
import { CentersService } from '../../shared/services/centers.service';
import { Centers } from '../../shared/models/Centers';
import { RouterModule } from '@angular/router';
import {
  ButtonDirective,
  ColComponent,  
  FormControlDirective,  
  FormLabelDirective,
  //FormModule,
  //RowComponent,
  FormSelectDirective
} from '@coreui/angular';

@Component({
  selector: 'app-stores-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule,ColComponent, FormLabelDirective, FormControlDirective,      
    ButtonDirective, FormSelectDirective],
  templateUrl: './stores-form.component.html',
})
export class StoresFormComponent {
  @Input() store: Stores | null = null;
  @Output() save = new EventEmitter<Partial<Stores>>();
  form: FormGroup;
  centers: Centers[] = [];

  constructor(private fb: FormBuilder, private centersService: CentersService) {
    this.form = this.fb.group({
      storeName: ['', Validators.required],
      centerId: [null, Validators.required],
      country: [],
      address: [],
      zipCode: [],
      city: [],
      state: [],
      time_zone: [],
      email: [],
      phoneNumber: [],
      webSite: [],
      logo: []
    });
  }

  ngOnChanges() {
    if (this.store) {
      this.form.patchValue({
        storeName: this.store.storeName,
        centerId: this.store.centerId,
        country: this.store.country,
        address: this.store.address,
        zipCode: this.store.zipCode,
        city: this.store.city,
        state: this.store.state,
        time_zone: this.store.time_zone,
        email: this.store.email,
        phoneNumber: this.store.phoneNumber,
        webSite: this.store.webSite,
        logo: this.store.logo,
      });
    }
  }

  ngOnInit(): void {
    // Cargar centros para el select
    this.centersService.getAll().subscribe((c) => (this.centers = c));
  }

  onSubmit() {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    }
  }
}
