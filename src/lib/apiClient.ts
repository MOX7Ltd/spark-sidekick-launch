import { getTelemetryHeaders } from './telemetry';
import { logEvent } from './eventLogger';

export interface ApiCallOptions {
  step: string;
  action: string;
  payloadKeys?: string[];
  provider?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

interface ApiResponse<T> {
  data: T;
  traceId: string;
  sessionId: string;
  durationMs: number;
}

export async function callWithRetry<T>(
  fn: (signal: AbortSignal, retryCount: number) => Promise<T>,
  options: ApiCallOptions
): Promise<ApiResponse<T>> {
  const { timeoutMs = 25000, maxRetries = 2 } = options;
  const headers = getTelemetryHeaders();
  const traceId = headers['X-Trace-Id'];
  const sessionId = headers['X-Session-Id'];
  
  let lastError: Error | null = null;
  const startTime = performance.now();
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const result = await fn(controller.signal, attempt);
      clearTimeout(timeoutId);
      
      const durationMs = Math.round(performance.now() - startTime);
      
      // Log success
      await logEvent({
        traceId,
        step: options.step,
        action: options.action,
        ok: true,
        durationMs,
        provider: options.provider,
        payloadKeys: options.payloadKeys,
      });
      
      return {
        data: result,
        traceId,
        sessionId,
        durationMs,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;
      
      // Don't retry if aborted by user
      if (error instanceof Error && error.name === 'AbortError') {
        break;
      }
      
      // Exponential backoff: 500ms, 1500ms
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(3, attempt)));
      }
    }
  }
  
  // Log failure
  const durationMs = Math.round(performance.now() - startTime);
  await logEvent({
    traceId,
    step: options.step,
    action: options.action,
    ok: false,
    durationMs,
    provider: options.provider,
    payloadKeys: options.payloadKeys,
    errorCode: lastError?.name,
    errorMessage: lastError?.message,
  });
  
  throw lastError;
}

export { getTelemetryHeaders };
