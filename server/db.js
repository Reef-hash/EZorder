import mongoose from 'mongoose';

// Singleton: cache the connection promise so multiple callers
// share the same connection and never open a second one.
let _connectionPromise = null;

export function connectDB() {
  // Already connected — reuse the existing connection immediately.
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  // Connection is in progress — return the cached promise.
  if (_connectionPromise) {
    return _connectionPromise;
  }

  // First call — create the connection and cache its promise.
  _connectionPromise = mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✓ MongoDB connected');
    })
    .catch((error) => {
      _connectionPromise = null; // allow retry on next call
      throw error; // propagate so callers can handle the failure
    });

  return _connectionPromise;
}
