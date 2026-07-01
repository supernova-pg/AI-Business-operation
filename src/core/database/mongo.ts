import mongoose from 'mongoose'

// Lazy-load the URI at connection time, not at module import time.
// This prevents the Docker build from crashing during Next.js page data collection.
let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectToMongo() {
  if (cached.conn) {
    return cached.conn
  }

  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env')
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}
