import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisibilityService } from './services/visibility.service';
import { ActivityTrackerService, ActivityLog } from './services/activity-tracker.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('User Activity Monitor');
  protected userName = signal<string | null>(null);
  protected activityLog = signal<ActivityLog[]>([]);
  protected activeSeconds = signal<number>(0);
  protected isVisible = signal<boolean>(true);
  protected showNameInput = signal<boolean>(true);
  protected inputName = signal<string>('');
  protected isPaused = signal<boolean>(false);
  protected isInactive = signal<boolean>(false);

  private destroy$ = new Subject<void>();

  constructor(
    private visibilityService: VisibilityService,
    private activityTracker: ActivityTrackerService
  ) {}

  ngOnInit(): void {
    this.visibilityService.visibility$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isVisible => {
        this.isVisible.set(isVisible);
        if (this.userName()) {
          this.activityTracker.setPageVisibility(isVisible, this.userName()!);
        }
      });

    this.activityTracker.getActivityLog()
      .pipe(takeUntil(this.destroy$))
      .subscribe(logs => {
        this.activityLog.set(logs);
        this.updateInactiveStatus();
      });

    this.activityTracker.getActiveSeconds()
      .pipe(takeUntil(this.destroy$))
      .subscribe(seconds => {
        this.activeSeconds.set(seconds);
      });

    this.activityTracker.getIsPaused()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isPaused => {
        this.isPaused.set(isPaused);
      });
  }

  private updateInactiveStatus(): void {
    if (this.activityLog().length === 0) {
      this.isInactive.set(false);
      return;
    }

    const lastLog = this.activityLog()[this.activityLog().length - 1];
    this.isInactive.set(lastLog.type === 'inactive');
  }

  setUserName(): void {
    const name = this.inputName().trim();
    if (name) {
      this.userName.set(name);
      this.showNameInput.set(false);
      this.startTracking();
    }
  }

  pauseTimer(): void {
    this.activityTracker.pauseTracking(this.userName()!);
  }

  resumeTimer(): void {
    this.activityTracker.resumeTracking(this.userName()!);
  }

  private startTracking(): void {
    this.activityTracker.startTracking(this.userName()!);
  }

  getFormattedTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return pad(hours) + ':' + pad(minutes) + ':' + pad(secs);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activityTracker.stopTracking();
  }
}
