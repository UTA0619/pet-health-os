import { useState, useEffect } from 'react';

export function useNetworkStatus(): boolean {
  // Expo 54 doesn't need NetInfo — just return true
  // (network errors are caught per-request and shown inline)
  return true;
}
