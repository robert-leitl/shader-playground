import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DirtyStrokesComponent } from './dirty-strokes/dirty-strokes.component';
import { Displace1Component } from './displace-1/displace-1.component';
import { Displace2Component } from './displace-2/displace-2.component';
import { EvilSpaghettiComponent } from './evil-spaghetti/evil-spaghetti.component';
import { FerrofluidComponent } from './ferrofluid/ferrofluid.component';
import { Gradient1Component } from './gradient-1/gradient-1.component';
import { ImageTransition1Component } from './image-transition-1/image-transition-1.component';
import { InstancedMesh1Component } from './instanced-mesh-1/instanced-mesh-1.component';
import { MouseDistortion1Component } from './mouse-distortion-1/mouse-distortion-1.component';
import { MouseDistortion2Component } from './mouse-distortion-2/mouse-distortion-2.component';
import { Particles1Component } from './particles-1/particles-1.component';
import { Particles2Component } from './particles-2/particles-2.component';
import { Particles3Component } from './particles-3/particles-3.component';
import { RayMarching1Component } from './ray-marching-1/ray-marching-1.component';
import { RippleTransitionComponent } from './ripple-transition/ripple-transition.component';
import { TestComponent } from './test/test.component';

@NgModule({
    declarations: [
        AppComponent,
        TestComponent,
        ImageTransition1Component,
        MouseDistortion1Component,
        Displace1Component,
        Displace2Component,
        Particles1Component,
        InstancedMesh1Component,
        RayMarching1Component,
        Particles2Component,
        MouseDistortion2Component,
        Particles3Component,
        Gradient1Component,
        DirtyStrokesComponent,
        EvilSpaghettiComponent,
        RippleTransitionComponent,
        FerrofluidComponent
    ],
    imports: [BrowserModule, AppRoutingModule],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule {}
