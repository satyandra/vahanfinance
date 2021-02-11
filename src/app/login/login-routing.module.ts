import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';



const rout: Routes = [
  {path: '', loadChildren : 'LoginComponent'}];

@NgModule({
  imports: [RouterModule.forChild(rout)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
