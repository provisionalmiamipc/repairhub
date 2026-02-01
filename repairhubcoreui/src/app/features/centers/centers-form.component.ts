import { Component, EventEmitter, Injectable, Input, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators , FormsModule, ReactiveFormsModule} from '@angular/forms';
import { Centers } from '../../shared/models/Centers';
import { CommonModule} from '@angular/common';


import {
  ButtonDirective,
  ColComponent,  
  FormControlDirective,  
  FormLabelDirective,
  //FormModule,
  //RowComponent,
} from '@coreui/angular';
import { pipe } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-centers-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, 
    ColComponent, FormLabelDirective, FormControlDirective,      
    ButtonDirective, RouterModule,
  FormsModule],
  templateUrl: './centers-form.component.html',  
  
})
export class CentersFormComponent {
  @Input() center: Partial<Centers> | null = null;    
  @Output() save = new EventEmitter<Partial<Centers>>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      centerName: [null, Validators.required],
      country: [],
      address: [],
      //zipCode: [],
      logo: [],
      city: [],
      state: [],
      time_zone: [],
      email: [],
      completion: [],
      webSite: [],
      phoneNumber: []
    });
    if(this.center?.id)
    {}
  }

  ngOnChanges() {
    if (this.center) {
      this.form.patchValue(this.center);
    }
  }

  onSubmit() {
    if (this.form.valid) {      
     this.save.emit(this.form.value);
    }
  }

  
}


