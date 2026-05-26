import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { setupNotifications } from '../lib/notifications';
import { ErrorBoundary } from '../components/error-boundary';

// Keep splash screen visible while we check auth state
SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const [authReady, setAuthReady] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Check existing session first to avoid white flash before redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuthGroup = segments[0] === '(auth)';
      const inAppGroup = segments[0] === '(app)';

      if (!session && inAppGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        router.replace('/(app)');
        setupNotifications().catch(console.error);
      }

      setAuthReady(true);
      SplashScreen.hideAsync().catch(() => {});
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)';
      if (!session && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        router.replace('/(app)');
        setupNotifications().catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, [segments, router]);

  useEffect(() => {
    // Navigate to app on notification tap
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(app)' as never);
    });

    return () => {
      if (responseListener.current) responseListener.current.remove();
      if (notificationListener.current) notificationListener.current.remove();
    };
  }, [router]);

  // Show loading spinner while auth is being determined (prevents white flash)
  if (!authReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }}
        accessibilityLabel="Loading / 読み込み中"
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

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
        <StatusBar style="auto" />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
