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
import { RayMarching1Sketch } from './ray-marching-1-sketch';

@Component({
    selector: 'app-test',
    template: ``,
    styles: [
        `
            app-test {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                overflow: hidden;
                touch-action: none;
                background: black;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RayMarching1Component implements OnInit, AfterViewInit, OnDestroy {
    private sketch: RayMarching1Sketch;

    private _destroyed$: Subject<boolean> = new Subject<boolean>();

    constructor(private hostElementRef: ElementRef, private ngZone: NgZone) {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        this.sketch = new RayMarching1Sketch(this.hostElementRef.nativeElement);
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
}
