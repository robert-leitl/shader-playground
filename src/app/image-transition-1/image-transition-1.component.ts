import {
    Component,
    OnInit,
    ViewEncapsulation,
    ChangeDetectionStrategy,
    ElementRef,
    AfterViewInit,
    NgZone,
    OnDestroy
} from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { ImageTransition1Sketch } from './image-transition-1-sketch';

@Component({
    selector: 'image-transition-1',
    template: `
        <div (pointerover)="onMouseOver($event)">
            <a></a>
            <a></a>
            <a></a>
        </div>
    `,
    styles: [
        `
            image-transition-1 {
                width: 100%;
                height: 100%;
                overflow: hidden;
                display: block;
            }

            app-test canvas {
                position: absolute;
            }

            app-test div {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                display: flex;
            }

            app-test a {
                flex: 1;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageTransition1Component
    implements OnInit, AfterViewInit, OnDestroy {
    private sketch: ImageTransition1Sketch;

    private _destroyed$: Subject<boolean> = new Subject<boolean>();

    constructor(private hostElementRef: ElementRef, private ngZone: NgZone) {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        this.sketch = new ImageTransition1Sketch(
            this.hostElementRef.nativeElement
        );
        this.sketch.oninit = () => {
            this.ngZone.runOutsideAngular(() => this.sketch.animate());

            fromEvent(window, 'resize')
                .pipe(debounceTime(200), takeUntil(this._destroyed$))
                .subscribe(() => this.sketch.updateSize());
        };
    }

    ngOnDestroy(): void {
        this.sketch.destroy();
        this._destroyed$.next(true);
        this._destroyed$.complete();
    }

    onMouseOver(e: Event): void {
        const linkElm: HTMLElement = e.target as HTMLElement;
        if (linkElm && linkElm.parentElement) {
            let i = 0;
            for (; i < linkElm.parentElement.children.length; ++i) {
                if (linkElm.parentElement.children[i] === linkElm) break;
            }

            this.sketch.setImage(i);
        }
    }
}
