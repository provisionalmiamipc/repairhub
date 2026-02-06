import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevelValues = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3
  };

  constructor() {}

  private getCurrentLogLevel(): number {
    const level = environment.logging.level as keyof typeof this.logLevelValues;
    return this.logLevelValues[level] || this.logLevelValues[LogLevel.INFO];
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevelValues[level] >= this.getCurrentLogLevel();
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    if (!environment.logging.enableConsole) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Loguear petición HTTP
   */
  logRequest(method: string, url: string, body?: any): void {
    this.debug(`[HTTP ${method}] ${url}`, body);
  }

  /**
   * Loguear respuesta HTTP
   */
  logResponse(method: string, url: string, status: number, response?: any): void {
    this.debug(`[HTTP ${method}] ${url} -> ${status}`, response);
  }

  /**
   * Loguear error HTTP
   */
  logHttpError(method: string, url: string, status: number, error?: any): void {
    this.error(`[HTTP ERROR ${method}] ${url} -> ${status}`, error);
  }

  /**
   * Loguear evento
   */
  logEvent(event: string, data?: any): void {
    this.info(`[EVENT] ${event}`, data);
  }

  /**
   * Loguear navegación
   */
  logNavigation(from: string, to: string): void {
    this.debug(`[NAVIGATION] ${from} → ${to}`);
  }

  /**
   * Loguear autenticación
   */
  logAuth(event: string, email?: string): void {
    this.info(`[AUTH] ${event}${email ? ' - ' + email : ''}`);
  }
}
