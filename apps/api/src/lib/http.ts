export const ok = <T>(data: T) => ({ data });
export const error = (code: string, message: string, details?: unknown) => ({ error: { code, message, details }});
