import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { Displace1Component } from "./displace-1/displace-1.component";
import { ImageTransition1Component } from "./image-transition-1/image-transition-1.component";
import { MouseDistortion1Component } from "./mouse-distortion-1/mouse-distortion-1.component";
import { TestComponent } from "./test/test.component";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    redirectTo: "3",
  },
  {
    path: "test",
    component: TestComponent,
  },
  {
    path: "1",
    component: ImageTransition1Component,
    data: {
      label: "1",
    },
  },
  {
    path: "2",
    component: MouseDistortion1Component,
    data: {
      label: "2",
    },
  },
  {
    path: "3",
    component: Displace1Component,
    data: {
      label: "3",
    },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: "legacy" })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
