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
import { Particles3Sketch } from './particles-3-sketch';

@Component({
    selector: 'app-particles-3',
    template: `
        <button
            (pointerenter)="onCtaPointerEnter()"
            (pointerleave)="onCtaPointerLeave()"
        >
            atuin.media
        </button>
    `,
    styles: [
        `
            app-particles-3 {
                display: block;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }

            button {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #eeeeee;
                border: none;
                font-size: 2em;
                font-weight: bold;
                border-radius: 2em;
                outline: none;
                padding: 0.5em;
                cursor: pointer;
                box-shadow: rgba(255, 255, 255, 0.5) 0px 0px 20px;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Particles3Component implements OnInit, AfterViewInit, OnDestroy {
    private sketch: Particles3Sketch;

    private _destroyed$: Subject<boolean> = new Subject<boolean>();

    constructor(private hostElementRef: ElementRef, private ngZone: NgZone) {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        this.sketch = new Particles3Sketch(this.hostElementRef.nativeElement);
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

    onCtaPointerEnter(): void {
        this.sketch.focus = true;
    }

    onCtaPointerLeave(): void {
        this.sketch.focus = false;
    }
}
