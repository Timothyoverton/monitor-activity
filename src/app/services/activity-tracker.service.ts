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
  private isPaused$ = new BehaviorSubject<boolean>(false);
  private activeStartTime: number | null = null;
  private inactiveStartTime: number | null = null;
  private timerInterval: any;
  private accumulatedSeconds: number = 0;
  private lastActivityTime: number = Date.now();
  private inactivityTimeout: any;
  private isManuallyPaused = false;

  getActivityLog(): Observable<ActivityLog[]> {
    return this.activityLog$.asObservable();
  }

  getActiveSeconds(): Observable<number> {
    return this.activeSeconds$.asObservable();
  }

  getIsPaused(): Observable<boolean> {
    return this.isPaused$.asObservable();
  }

  getCurrentSeconds(): number {
    return this.activeSeconds$.getValue();
  }

  startTracking(userName: string): void {
    this.addLog(`User "${userName}" started session`, 'active');
    this.isManuallyPaused = false;
    this.isPaused$.next(false);
    this.setUserActive(userName);
    this.startTimer();
    this.setupInactivityDetection(userName);
  }

  setUserActive(userName: string): void {
    if (this.isManuallyPaused) {
      return;
    }

    if (this.inactiveStartTime !== null) {
      const inactiveDuration = (Date.now() - this.inactiveStartTime) / 1000;
      this.addLog(`${userName} is active again (was inactive for ${Math.round(inactiveDuration)}s)`, 'active');
      this.inactiveStartTime = null;
    }

    if (this.activeStartTime === null) {
      this.activeStartTime = Date.now();
    }

    this.lastActivityTime = Date.now();
    this.resetInactivityTimer(userName);
  }

  setUserInactive(userName: string): void {
    if (this.isManuallyPaused) {
      return;
    }

    if (this.activeStartTime !== null) {
      const activeDuration = (Date.now() - this.activeStartTime) / 1000;
      this.accumulatedSeconds += Math.floor(activeDuration);
      this.activeSeconds$.next(this.accumulatedSeconds);
      this.activeStartTime = null;
    }

    this.addLog(`${userName} moved away from page`, 'inactive');
    this.inactiveStartTime = Date.now();
  }

  pauseTracking(userName: string): void {
    this.isManuallyPaused = true;
    this.isPaused$.next(true);
    this.addLog(`${userName} paused activity tracking`, 'inactive');

    if (this.activeStartTime !== null) {
      const activeDuration = (Date.now() - this.activeStartTime) / 1000;
      this.accumulatedSeconds += Math.floor(activeDuration);
      this.activeSeconds$.next(this.accumulatedSeconds);
      this.activeStartTime = null;
    }

    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
  }

  resumeTracking(userName: string): void {
    if (!this.isManuallyPaused) {
      return;
    }

    this.isManuallyPaused = false;
    this.isPaused$.next(false);
    this.addLog(`${userName} resumed activity tracking`, 'active');
    this.setUserActive(userName);
  }

  private setupInactivityDetection(userName: string): void {
    document.addEventListener('mousemove', () => this.setUserActive(userName));
    document.addEventListener('keypress', () => this.setUserActive(userName));
    document.addEventListener('click', () => this.setUserActive(userName));
  }

  private resetInactivityTimer(userName: string): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }

    this.inactivityTimeout = setTimeout(() => {
      if (Date.now() - this.lastActivityTime > 3000) {
        this.setUserInactive(userName);
      }
    }, 3000);
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.activeStartTime !== null && !this.isManuallyPaused) {
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
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
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
    this.isManuallyPaused = false;
    this.isPaused$.next(false);
  }
}
