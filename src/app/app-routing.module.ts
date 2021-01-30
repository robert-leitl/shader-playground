import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { Displace1Component } from './displace-1/displace-1.component';
import { Displace2Component } from './displace-2/displace-2.component';
import { ImageTransition1Component } from './image-transition-1/image-transition-1.component';
import { InstancedMesh1Component } from './instanced-mesh-1/instanced-mesh-1.component';
import { MouseDistortion1Component } from './mouse-distortion-1/mouse-distortion-1.component';
import { MouseDistortion2Component } from './mouse-distortion-2/mouse-distortion-2.component';
import { Particles1Component } from './particles-1/particles-1.component';
import { RayMarching1Component } from './ray-marching-1/ray-marching-1.component';
import { TestComponent } from './test/test.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: '8'
    },
    {
        path: 'test',
        component: TestComponent
    },
    {
        path: '1',
        component: ImageTransition1Component,
        data: {
            label: '1'
        }
    },
    {
        path: '2',
        component: MouseDistortion1Component,
        data: {
            label: '2'
        }
    },
    {
        path: '3',
        component: Displace1Component,
        data: {
            label: '3'
        }
    },
    {
        path: '4',
        component: Displace2Component,
        data: {
            label: '4'
        }
    },
    {
        path: '5',
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
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
    ],
    exports: [RouterModule]
})
export class AppRoutingModule {}
