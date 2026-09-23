import { env } from './config/env.js'
import { initSentry } from './config/sentry.js'

initSentry()

import { logger } from './config/logger.js'
import { connectDatabase, disconnectDatabase } from './config/db.js'
import { getRedis, disconnectRedis } from './config/redis.js'
import { ensureReservedCategories } from './config/categories.js'
import { ensureSeriesOrder } from './config/series.js'
import { createApp } from './app.js'
import { TranslationService } from './services/TranslationService.js'
import { startBackupJob, stopBackupJob } from './jobs/backupJob.js'
import { UsageService } from './services/UsageService.js'

async function bootstrap() {
  await connectDatabase()
  await ensureReservedCategories()
  await ensureSeriesOrder()
  // Mongoose's autoIndex is off in production, so the view counter's unique
  // day index has to be created explicitly.
  await UsageService.ensureIndexes()
  if (env.REDIS_ENABLED) getRedis()

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    logger.info(`server listening on :${env.PORT}`, { env: env.NODE_ENV })
  })

  // Kick off translation-model load in the background so the first user
  // request doesn't pay the 10–30s ONNX init cost.
  TranslationService.warmup()

  startBackupJob()

  const shutdown = async (signal: string) => {
    logger.info(`received ${signal}, shutting down`)
    stopBackupJob()
    server.close(() => logger.info('HTTP server closed'))
    await disconnectDatabase().catch(() => {
    })
    await disconnectRedis().catch(() => {
    })
    process.exit(0)
  }

  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('unhandledRejection', (err) => logger.error('unhandled rejection', { err }))
  process.on('uncaughtException', (err) => logger.error('uncaught exception', { err }))
}

bootstrap().catch((err) => {
  logger.error('bootstrap failed', { err: (err as Error).stack ?? err })
  process.exit(1)
})
