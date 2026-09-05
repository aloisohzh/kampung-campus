export const date = (value: string) =>
  new Date(value).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
    timeZone: 'Asia/Singapore',
  });
export const time = (value: string) =>
  new Date(value).toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Singapore',
  });
export type Run = (
  type: string,
  payload?: Record<string, unknown>,
) => Promise<boolean>;
