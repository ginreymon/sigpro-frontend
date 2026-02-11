import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ResetPasswordService {
  private resetToken: string | null = null;
  private expiresAt: number | null = null;

  setToken(token: string, expiresInMinutes: number) {
    this.resetToken = token;
    this.expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  }

  getToken(): string | null {
    if (this.expiresAt && Date.now() > this.expiresAt) {
      this.clearToken();
      return null;
    }
    return this.resetToken;
  }

  clearToken() {
    this.resetToken = null;
    this.expiresAt = null;
  }
}
