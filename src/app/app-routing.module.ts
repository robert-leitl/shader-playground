import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DirtyStrokesComponent } from './dirty-strokes/dirty-strokes.component';
import { Displace1Component } from './displace-1/displace-1.component';
import { Displace2Component } from './displace-2/displace-2.component';
import { EvilSpaghettiComponent } from './evil-spaghetti/evil-spaghetti.component';
import { FerrofluidComponent } from './ferrofluid/ferrofluid.component';
import { GoochShadingComponent } from './gooch-shading/gooch-shading.component';
import { Gradient1Component } from './gradient-1/gradient-1.component';
import { HoloLandscapeComponent } from './holo-landscape/holo-landscape.component';
import { ImageTransition1Component } from './image-transition-1/image-transition-1.component';
import { InstancedMesh1Component } from './instanced-mesh-1/instanced-mesh-1.component';
import { MouseDistortion1Component } from './mouse-distortion-1/mouse-distortion-1.component';
import { MouseDistortion2Component } from './mouse-distortion-2/mouse-distortion-2.component';
import { Particles1Component } from './particles-1/particles-1.component';
import { Particles2Component } from './particles-2/particles-2.component';
import { Particles3Component } from './particles-3/particles-3.component';
import { RayMarching1Component } from './ray-marching-1/ray-marching-1.component';
import { ReactionDiffusion1Component } from './reaction-diffusion-1/reaction-diffusion-1.component';
import { RibbonComponent } from './ribbon/ribbon.component';
import { RippleTransitionComponent } from './ripple-transition/ripple-transition.component';
import { TestComponent } from './test/test.component';
import { VoronoiClusterComponent } from './voronoi-cluster/voronoi-cluster.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '20'
    },
    {
        path: 'test',
        pathMatch: 'full',
        component: TestComponent
    },
    {
        path: '1',
        pathMatch: 'full',
        component: ImageTransition1Component,
        data: {
            label: '1'
        }
    },
    {
        path: '2',
        pathMatch: 'full',
        component: MouseDistortion1Component,
        data: {
            label: '2'
        }
    },
    {
        path: '3',
        pathMatch: 'full',
        component: Displace1Component,
        data: {
            label: '3'
        }
    },
    {
        path: '4',
        pathMatch: 'full',
        component: Displace2Component,
        data: {
            label: '4'
        }
    },
    {
        path: '5',
        pathMatch: 'full',
        component: MouseDistortion2Component,
        data: {
            label: '5'
        }
    },
    {
        path: '6',
        component: Particles1Component,
        data: {
            label: '6'
        }
    },
    {
        path: '7',
        pathMatch: 'full',
        component: InstancedMesh1Component,
        data: {
            label: '7'
        }
    },
    {
        path: '8',
        component: RayMarching1Component,
        data: {
            label: '8'
        }
    },
    {
        path: '9',
        pathMatch: 'full',
        component: Particles2Component,
        data: {
            label: '9'
        }
    },
    {
        path: '10',
        pathMatch: 'full',
        component: Particles3Component,
        data: {
            label: '10'
        }
    },
    {
        path: '11',
        pathMatch: 'full',
        component: Gradient1Component,
        data: {
            label: '11'
        }
    },
    {
        path: '12',
        pathMatch: 'full',
        component: DirtyStrokesComponent,
        data: {
            label: '12'
        }
    },
    {
        path: '13',
        pathMatch: 'full',
        component: EvilSpaghettiComponent,
        data: {
            label: '13'
        }
    },
    {
        path: '14',
        pathMatch: 'full',
        component: RippleTransitionComponent,
        data: {
            label: '14'
        }
    },
    {
        path: '15',
        pathMatch: 'full',
        component: FerrofluidComponent,
        data: {
            label: '15'
        }
    },
    {
        path: '16',
        pathMatch: 'full',
        component: HoloLandscapeComponent,
        data: {
            label: '16'
        }
    },
    {
        path: '17',
        pathMatch: 'full',
        component: VoronoiClusterComponent,
        data: {
            label: '17'
        }
    },
    {
        path: '18',
        pathMatch: 'full',
        component: ReactionDiffusion1Component,
        data: {
            label: '18'
        }
    },
    {
        path: '19',
        pathMatch: 'full',
        component: GoochShadingComponent,
        data: {
            label: '19'
        }
    },
    {
        path: '20',
        pathMatch: 'full',
        component: RibbonComponent,
        data: {
            label: '20'
        }
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            relativeLinkResolution: 'legacy',
            useHash: true
        })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {}
