import { Injectable, NgZone } from '@angular/core';
import { Observable, fromEvent, merge } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VisibilityService {

  visibility$: Observable<boolean>;

  constructor(private ngZone: NgZone) {
    this.visibility$ = this.ngZone.runOutsideAngular(() =>
      merge(
        fromEvent(document, 'visibilitychange'),
        fromEvent(window, 'focus'),
        fromEvent(window, 'blur')
      ).pipe(
        map(() => !document.hidden),
        startWith(!document.hidden)
      )
    );
  }

  isVisible(): boolean {
    return !document.hidden;
  }
}
