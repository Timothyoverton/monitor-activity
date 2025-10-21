import { Injectable, NgZone } from '@angular/core';
import { Observable, fromEvent, merge, Subject } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VisibilityService {

  visibility$: Observable<boolean>;
  private visibilitySubject = new Subject<boolean>();

  constructor(private ngZone: NgZone) {
    this.visibility$ = this.ngZone.runOutsideAngular(() =>
      merge(
        fromEvent(document, 'visibilitychange'),
        fromEvent(window, 'focus'),
        fromEvent(window, 'blur'),
        this.visibilitySubject
      ).pipe(
        map(() => this.getVisibilityState()),
        startWith(this.getVisibilityState()),
        distinctUntilChanged()
      )
    );

    // Periodically check visibility state to catch edge cases
    setInterval(() => {
      this.visibilitySubject.next(this.getVisibilityState());
    }, 500);
  }

  private getVisibilityState(): boolean {
    return !document.hidden;
  }

  isVisible(): boolean {
    return !document.hidden;
  }
}
