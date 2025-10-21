import { Injectable, NgZone } from '@angular/core';
import { Observable, fromEvent, merge, Subject, interval } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VisibilityService {

  visibility$: Observable<boolean>;
  private visibilitySubject = new Subject<boolean>();
  private lastVisibilityState: boolean = !document.hidden;

  constructor(private ngZone: NgZone) {
    this.visibility$ = this.ngZone.runOutsideAngular(() =>
      merge(
        fromEvent(document, 'visibilitychange'),
        fromEvent(window, 'focus'),
        fromEvent(window, 'blur'),
        fromEvent(window, 'pagehide'),
        fromEvent(window, 'pageshow'),
        interval(300), // Check every 300ms
        this.visibilitySubject
      ).pipe(
        map(() => {
          const currentState = this.getVisibilityState();
          console.log('Visibility check:', {
            hidden: document.hidden,
            visibilityState: document.visibilityState,
            isVisible: currentState,
            timestamp: new Date().toLocaleTimeString()
          });
          return currentState;
        }),
        distinctUntilChanged(),
        startWith(!document.hidden)
      )
    );

    // Also listen to direct visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        console.log('Visibility changed:', {
          hidden: document.hidden,
          visibilityState: document.visibilityState
        });
        this.visibilitySubject.next(this.getVisibilityState());
      });
    }
  }

  private getVisibilityState(): boolean {
    this.lastVisibilityState = !document.hidden;
    return this.lastVisibilityState;
  }

  isVisible(): boolean {
    return !document.hidden;
  }
}
