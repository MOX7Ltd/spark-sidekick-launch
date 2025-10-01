// Session and trace management
export function getSessionId(): string {
  const params = new URLSearchParams(window.location.search);
  let sessionId = params.get('sid') || localStorage.getItem('session_id');
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
    
    // Update URL with session ID
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('sid', sessionId);
    const newUrl = `${window.location.pathname}?${newParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }
  
  return sessionId;
}

export function generateTraceId(): string {
  // Generate nanoid-style ID (10 chars, URL-safe)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function getTelemetryHeaders(): Record<string, string> {
  return {
    'X-Session-Id': getSessionId(),
    'X-Trace-Id': generateTraceId(),
    'X-Env': import.meta.env.MODE || 'production',
  };
}
