import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[tabStyles.icon, focused && tabStyles.iconFocused]}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, { color: focused ? colors.primary : colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  icon: { alignItems: 'center', paddingTop: 6 },
  iconFocused: {},
  emoji: { fontSize: 22 },
  label: { fontSize: 10, marginTop: 2 },
});

export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
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
      <Tabs.Screen
        name="add-pet"
        options={{ href: null }}
      />
    </Tabs>
  );
}
