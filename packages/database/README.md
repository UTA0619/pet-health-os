# @pet-health-os/database

Shared Supabase database types for web, mobile, and edge functions.

## Usage

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@pet-health-os/database';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Fully typed queries
const { data: pets } = await supabase
  .from('pets')
  .select('*')
  .eq('owner_id', userId);
```

## Available types

- `Profile`, `Pet`, `PetPhoto`, `PetWeightHistory`
- `HealthLog`, `SymptomReport`, `VetVisit`
- `HealthScore`, `AnomalyDetection`, `CameraAnalysis`, `PetBaseline`
- `Subscription`, `BillingEvent`, `NotificationPreferences`, `PushSubscription`
- `AiJob`
- `Database` — pass to `createClient<Database>()` for full type safety

## Keeping types in sync

When you add a new migration, update `src/types.ts` to reflect the new columns or tables.
