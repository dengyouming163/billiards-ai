'use client';
// wwwpos/src/utils/notification-sound.ts

export type SoundType = 'alert' | 'ding' | 'subtle'

const MP3_MAP: Record<string, string[]> = {
  service_call:               ['/sounds/service_call_1.mp3', '/sounds/service_call_2.mp3'],
  table_open_confirm_request: ['/sounds/open_confirm_1.mp3', '/sounds/open_confirm_2.mp3'],
  table_timeout:              ['/sounds/table_timeout_1.mp3', '/sounds/table_timeout_2.mp3'],
  checkout_remind:            ['/sounds/checkout_remind_1.mp3', '/sounds/checkout_remind_2.mp3'],
  table_open:                 ['/sounds/table_open_1.mp3'],
  new_order:                  ['/sounds/new_order_1.mp3', '/sounds/new_order_2.mp3'],
  assistant_apply:            ['/sounds/assistant_apply_1.mp3', '/sounds/assistant_apply_2.mp3'],
  payment_success:            ['/sounds/payment_success_1.mp3', '/sounds/payment_success_2.mp3'],
  checkout_completed:         ['/sounds/payment_success_1.mp3'],
}

class NotificationSound {
  private muted = false
  private unlocked = false
  private audioPool: HTMLAudioElement[] = []
  private pendingSound: string | null = null

  constructor() {
    if (typeof window === 'undefined') return
    this.muted = localStorage.getItem('pos_notification_muted') === 'true'
    this.unlockAudio()
  }

  /** 主动解锁音频（登录按钮点击等场景调用） */
  unlock(): void {
    if (this.unlocked) return
    const audio = new Audio('/sounds/ding.mp3')
    audio.volume = 0.01
    audio.play().then(() => {
      audio.pause()
      audio.currentTime = 0
      this.unlocked = true
      console.log('[Sound] unlocked')
      if (this.pendingSound) {
        console.log('[Sound] replaying blocked:', this.pendingSound)
        this.playMp3(this.pendingSound)
        this.pendingSound = null
      }
    }).catch(() => {})
  }

  /** 浏览器 autoplay 限制 + 补播被拦截声音 */
  private unlockAudio(): void {
    const doUnlock = () => this.unlock()
    document.addEventListener('click', doUnlock, { once: true })
    document.addEventListener('touchstart', doUnlock, { once: true })
    document.addEventListener('keydown', doUnlock, { once: true })
  }

  playNotification(type: string): void {
    if (this.muted) { console.log('[Sound] muted, skip'); return }
    const files = MP3_MAP[type]
    if (!files || files.length === 0) { console.log('[Sound] no file for:', type); return }
    const file = files[Math.floor(Math.random() * files.length)]
    // 如果还没解锁，尝试主动解锁
    if (!this.unlocked) this.unlock()
    console.log('[Sound] ▶', file, 'unlocked:', this.unlocked)
    this.playMp3(file)
  }

  private playMp3(src: string): void {
    try {
      this.audioPool = this.audioPool.filter(a => !a.ended && !a.paused)
      if (this.audioPool.length > 10) this.audioPool.shift()

      const audio = new Audio(src)
      audio.volume = 0.8
      this.audioPool.push(audio)

      const promise = audio.play()
      if (promise) {
        promise.then(() => {
          console.log('[Sound] ✅ playing:', src)
        }).catch((e) => {
          console.log('[Sound] ❌ blocked:', src, e.name)
          if (e.name === 'NotAllowedError' && !this.unlocked) {
            this.pendingSound = src
            console.log('[Sound] saved for replay after unlock')
          }
        })
      }
    } catch {}
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    localStorage.setItem('pos_notification_muted', String(muted))
  }

  isMuted(): boolean { return this.muted }
}

export const notificationSound = new NotificationSound()
