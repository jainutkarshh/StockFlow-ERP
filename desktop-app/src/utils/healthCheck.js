/**
 * Health Check Utility with Silent Retry Logic
 * 
 * Periodically checks backend availability without showing notifications immediately.
 * Only notifies user if backend remains offline after initial grace period.
 * Automatically recovers silently when backend comes back online.
 */

import { api } from '../api/axiosClient';

let healthCheckInterval = null;
let isOnline = true;
let hasShownOfflineAlert = false;
const RETRY_INTERVAL = 5000; // 5 seconds
const INITIAL_GRACE_PERIOD = 3000; // 3 seconds before showing offline alert

/**
 * Start background health check polling
 * @param {Function} onStatusChange - Callback when backend status changes (online/offline)
 * @returns {Function} cleanup function to stop polling
 */
export const startHealthCheck = (onStatusChange) => {
  let initialCheckDone = false;
  let graceTimer = null;

  // Perform initial check
  const performHealthCheck = async () => {
    try {
      await api.healthCheck();

      // Backend is online
      if (!isOnline) {
        console.log('✓ Backend is back online');
        isOnline = true;
        hasShownOfflineAlert = false;
        onStatusChange(true);
      }
    } catch (error) {
      if (isOnline) {
        console.warn('✗ Backend offline. Retrying in background...');
        isOnline = false;

        // Only notify after grace period + retry
        if (initialCheckDone && !graceTimer) {
          graceTimer = setTimeout(() => {
            if (!isOnline && !hasShownOfflineAlert) {
              hasShownOfflineAlert = true;
              onStatusChange(false);
            }
            graceTimer = null;
          }, INITIAL_GRACE_PERIOD);
        }
      }
    }
  };

  // Initial check
  performHealthCheck().then(() => {
    initialCheckDone = true;
  });

  // Start polling
  healthCheckInterval = setInterval(performHealthCheck, RETRY_INTERVAL);

  // Return cleanup function
  return () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
    if (graceTimer) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
  };
};

/**
 * Stop background health check polling
 */
export const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

/**
 * Get current backend online status
 */
export const isBackendOnline = () => isOnline;
