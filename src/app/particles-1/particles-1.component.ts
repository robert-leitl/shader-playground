import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ElementRef,
  AfterViewInit,
  NgZone,
  OnDestroy,
} from "@angular/core";
import { fromEvent, Subject } from "rxjs";
import { debounceTime, takeUntil } from "rxjs/operators";
import { Particles1Sketch } from "./particles-1-sketch";

@Component({
  selector: "app-test",
  template: ``,
  styles: [
    `
      app-test {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Particles1Component implements OnInit, AfterViewInit, OnDestroy {
  private sketch: Particles1Sketch;

  private _destroyed$: Subject<boolean> = new Subject<boolean>();

  constructor(private hostElementRef: ElementRef, private ngZone: NgZone) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.sketch = new Particles1Sketch(this.hostElementRef.nativeElement);
    this.sketch.oninit = () => {
      this.ngZone.runOutsideAngular(() => this.sketch.animate());

      fromEvent(window, "resize")
        .pipe(debounceTime(200), takeUntil(this._destroyed$))
        .subscribe(() => this.sketch.updateSize());
    };
  }

  ngOnDestroy(): void {
    this._destroyed$.next(true);
    this._destroyed$.complete();
  }
}
