import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AppointmentsListComponent } from './appointments-list.component';
import { AppointmentsDetailComponent } from './appointments-detail.component';
import { AppointmentsFormComponent } from './appointments-form.component';
import { AppointmentsEditComponent } from './appointments-edit.component';

@NgModule({
  declarations: [
    
  ],
  imports: [CommonModule, ReactiveFormsModule],
  exports: [
   
  ],
})
export class AppointmentsModule {}
