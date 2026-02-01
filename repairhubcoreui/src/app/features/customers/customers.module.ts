import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

/**
 * Customers Module (Legacy - components are now standalone)
 * This module is kept for backwards compatibility but all
 * customer components are now standalone and don't need NgModule declaration
 */
@NgModule({
  declarations: [],
  imports: [CommonModule, ReactiveFormsModule],
  exports: []
})
export class CustomersModule { }

