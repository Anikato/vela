import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  ...(isProduction
    ? { formatters: { level: (label) => ({ level: label }) } }
    : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
});

export function createLogger(module: string) {
  return logger.child({ module });
}
