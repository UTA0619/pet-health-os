import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelFocused]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  icon: { alignItems: 'center', paddingTop: 6 },
  iconFocused: {},
  emoji: { fontSize: 22 },
  label: { fontSize: 10, color: '#71717a', marginTop: 2 },
  labelFocused: { color: '#10b981', fontWeight: '600' },
});

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f4f4f5',
          height: 80,
          paddingBottom: 16,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="ホーム" focused={focused} />,
          tabBarAccessibilityLabel: 'Home / ホーム',
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📝" label="記録" focused={focused} />,
          tabBarAccessibilityLabel: 'Health log / 記録',
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📷" label="スキャン" focused={focused} />,
          tabBarAccessibilityLabel: 'AI camera scan / スキャン',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="設定" focused={focused} />,
          tabBarAccessibilityLabel: 'Settings / 設定',
        }}
      />
      <Tabs.Screen
        name="pets"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="privacy"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="onboarding"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="terms"
        options={{ href: null }}
      />
    </Tabs>
  );
}
