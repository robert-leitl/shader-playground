import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { Displace1Component } from "./displace-1/displace-1.component";
import { Displace2Component } from "./displace-2/displace-2.component";
import { ImageTransition1Component } from "./image-transition-1/image-transition-1.component";
import { MouseDistortion1Component } from "./mouse-distortion-1/mouse-distortion-1.component";
import { TestComponent } from "./test/test.component";

@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    ImageTransition1Component,
    MouseDistortion1Component,
    Displace1Component,
    Displace2Component,
  ],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
