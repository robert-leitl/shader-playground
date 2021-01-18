import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ImageTransition1Component } from './image-transition-1/image-transition-1.component';
import { TestComponent } from './test/test.component';


const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '1'
  },
  {
    path: 'test',
    component: TestComponent
  },
  {
    path: '1',
    component: ImageTransition1Component
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
