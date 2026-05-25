import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { setupNotifications } from '../lib/notifications';
import { ErrorBoundary } from '../components/error-boundary';

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)';
      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        router.replace('/(app)');
        // Set up push notifications after login confirmed
        setupNotifications().catch(console.error);
      }
    });
    return () => subscription.unsubscribe();
  }, [segments, router]);

  useEffect(() => {
    // Listen for notification responses (when user taps a notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(app)' as never);
    });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
