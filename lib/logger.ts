import { db } from './db';

export const logger = {
  async info(context: string, message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] [${context}] ${message}`);
    try {
      await db.systemLogs.add({
        timestamp,
        level: 'info',
        context,
        message,
      });
    } catch (e) {
      console.error('Failed to write log to IndexedDB:', e);
    }
  },

  async warn(context: string, message: string) {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] [${context}] ${message}`);
    try {
      await db.systemLogs.add({
        timestamp,
        level: 'warn',
        context,
        message,
      });
    } catch (e) {
      console.error('Failed to write log to IndexedDB:', e);
    }
  },

  async error(context: string, message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const stack_trace = error instanceof Error 
      ? error.stack 
      : (error ? String(error) : undefined);
    
    console.error(`[ERROR] [${context}] ${message}`, error);
    try {
      await db.systemLogs.add({
        timestamp,
        level: 'error',
        context,
        message,
        stack_trace,
      });
    } catch (e) {
      console.error('Failed to write log to IndexedDB:', e);
    }
  }
};
