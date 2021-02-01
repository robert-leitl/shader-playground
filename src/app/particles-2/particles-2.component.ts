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
import { Particles2Sketch } from './particles-2-sketch';

@Component({
    selector: 'particles-2',
    template: `
        <svg
            width="158"
            height="158"
            viewBox="0 0 158 158"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                class="logo-path"
                d="M74.7991 96.0839C74.7991 92.7105 75.8758 90.5572 77.8853 88.2605L88.5077 77.4947C90.8044 75.4852 92.9577 74.4085 96.3311 74.4085H126.493V83.021H87.8617C84.9908 83.021 82.6941 85.4615 82.6941 88.3324V126.103H74.7991V96.0839V96.0839Z"
                stroke="black"
            />
            <path
                class="logo-path"
                d="M82.6943 62.0189C82.6943 65.3923 81.6176 67.5456 79.6081 69.8423L68.9858 80.6081C66.689 82.6176 64.5357 83.6943 61.1623 83.6943L31 83.6943L31 75.0818L69.6318 75.0818C72.5026 75.0818 74.7993 72.6412 74.7993 69.7704L74.7993 32L82.6943 32L82.6943 62.0189Z"
                stroke="black"
            />
            <path
                class="logo-path"
                d="M136.445 79C136.445 47.3247 110.675 21.5549 79 21.5549C47.3247 21.5549 21.5549 47.3247 21.5549 79C21.5549 110.675 47.3247 136.445 79 136.445C110.675 136.445 136.445 110.675 136.445 79Z"
                stroke="black"
            />
            <path
                class="logo-path"
                d="M79 15C43.6538 15 15 43.6537 15 79C15 114.346 43.6538 143 79 143C114.346 143 143 114.346 143 79C143 43.6537 114.346 15 79 15Z"
                stroke="black"
            />
        </svg>
    `,
    styles: [
        `
            particles-2 {
                display: block;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }

            svg {
                display: none;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Particles2Component implements OnInit, AfterViewInit, OnDestroy {
    private sketch: Particles2Sketch;

    private _destroyed$: Subject<boolean> = new Subject<boolean>();

    constructor(private hostElementRef: ElementRef, private ngZone: NgZone) {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        this.sketch = new Particles2Sketch(this.hostElementRef.nativeElement);
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
