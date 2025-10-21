import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ActivityLog {
  timestamp: Date;
  message: string;
  type: 'active' | 'inactive';
}

@Injectable({ providedIn: 'root' })
export class ActivityTrackerService {

  private activityLog$ = new BehaviorSubject<ActivityLog[]>([]);
  private activeSeconds$ = new BehaviorSubject<number>(0);
  private activeStartTime: number | null = null;
  private inactiveStartTime: number | null = null;
  private timerInterval: any;
  private accumulatedSeconds: number = 0;

  getActivityLog(): Observable<ActivityLog[]> {
    return this.activityLog$.asObservable();
  }

  getActiveSeconds(): Observable<number> {
    return this.activeSeconds$.asObservable();
  }

  getCurrentSeconds(): number {
    return this.activeSeconds$.getValue();
  }

  startTracking(userName: string): void {
    // Initial log entry
    this.addLog(`User "${userName}" started session`, 'active');
    this.setUserActive(userName);
    this.startTimer();
  }

  setUserActive(userName: string): void {
    if (this.inactiveStartTime !== null) {
      // Coming back from inactive state
      const inactiveDuration = (Date.now() - this.inactiveStartTime) / 1000;
      this.addLog(`${userName} is active again (was inactive for ${Math.round(inactiveDuration)}s)`, 'active');
      this.inactiveStartTime = null;
    }

    if (this.activeStartTime === null) {
      this.activeStartTime = Date.now();
    }
  }

  setUserInactive(userName: string): void {
    if (this.activeStartTime !== null) {
      // Calculate time spent active in this session
      const activeDuration = (Date.now() - this.activeStartTime) / 1000;
      this.accumulatedSeconds += Math.floor(activeDuration);
      this.activeSeconds$.next(this.accumulatedSeconds);
      this.activeStartTime = null;
    }

    this.addLog(`${userName} moved away from page`, 'inactive');
    this.inactiveStartTime = Date.now();
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.activeStartTime !== null) {
        const currentActive = (Date.now() - this.activeStartTime) / 1000;
        const totalSeconds = this.accumulatedSeconds + Math.floor(currentActive);
        this.activeSeconds$.next(totalSeconds);
      }
    }, 1000);
  }

  stopTracking(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private addLog(message: string, type: 'active' | 'inactive'): void {
    const currentLog = this.activityLog$.getValue();
    const newLog: ActivityLog = {
      timestamp: new Date(),
      message,
      type
    };
    this.activityLog$.next([...currentLog, newLog]);
  }

  clearLog(): void {
    this.activityLog$.next([]);
    this.accumulatedSeconds = 0;
    this.activeSeconds$.next(0);
    this.activeStartTime = null;
    this.inactiveStartTime = null;
  }
}
