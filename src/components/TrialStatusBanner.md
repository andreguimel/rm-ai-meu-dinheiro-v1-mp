# TrialStatusBanner Component

The `TrialStatusBanner` component displays a color-coded banner to show trial status and days remaining for users with active trials.

## Features

- **Color-coded alerts**: Green (4+ days), Yellow (2-3 days), Red (1 day or less)
- **Responsive design**: Works on mobile and desktop
- **Upgrade integration**: Connects to existing checkout flow
- **Auto-hide logic**: Only shows for users with active trials
- **Customizable**: Supports custom upgrade handlers and styling

## Usage

### Basic Usage

```tsx
import { TrialStatusBanner } from "@/components/TrialStatusBanner";

function Dashboard() {
  return (
    <div>
      <TrialStatusBanner />
      {/* Rest of your dashboard content */}
    </div>
  );
}
```

### With Custom Upgrade Handler

```tsx
import { TrialStatusBanner } from "@/components/TrialStatusBanner";

function Dashboard() {
  const handleCustomUpgrade = () => {
    // Custom upgrade logic
    console.log("Custom upgrade flow");
  };

  return (
    <div>
      <TrialStatusBanner onUpgrade={handleCustomUpgrade} />
      {/* Rest of your dashboard content */}
    </div>
  );
}
```

### With Custom Styling

```tsx
import { TrialStatusBanner } from "@/components/TrialStatusBanner";

function Dashboard() {
  return (
    <div>
      <TrialStatusBanner className="mx-4 my-2" />
      {/* Rest of your dashboard content */}
    </div>
  );
}
```

## Props

| Prop        | Type         | Default     | Description                                                                           |
| ----------- | ------------ | ----------- | ------------------------------------------------------------------------------------- |
| `onUpgrade` | `() => void` | `undefined` | Custom upgrade handler. If not provided, uses `createCheckout` from `useSubscription` |
| `className` | `string`     | `undefined` | Additional CSS classes to apply to the banner                                         |

## Behavior

### Display Logic

The banner only displays when:

- User is not loading subscription data
- User does not have a paid subscription
- User has an active trial

### Color Coding

- **Green** (4+ days remaining): Calm, informative tone
- **Yellow** (2-3 days remaining): Warning tone with urgency message
- **Red** (1 day or less): Critical tone with immediate action required

### Button Text

- **4+ days**: "Fazer Upgrade"
- **2-3 days**: "Fazer Upgrade"
- **1 day or less**: "Assinar Agora"

### Responsive Design

- **Mobile**: Stacked layout with full-width button
- **Desktop**: Horizontal layout with inline button

## Integration with useSubscription

The component automatically integrates with the `useSubscription` hook to:

- Get trial status and days remaining
- Access the `createCheckout` function for upgrades
- Handle loading states appropriately

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- Uses `Alert` component from shadcn/ui
- Follows color scheme: green-50/200/600, yellow-50/200/600, red-50/200/600
- Responsive classes: `sm:flex-row`, `sm:items-center`, etc.

## Examples

### 7 Days Remaining (Green)

```
🎁 [Período de Teste] 7 dias restantes
   Aproveite todos os recursos premium até 25/12/2024.
   [Fazer Upgrade]
```

### 2 Days Remaining (Yellow)

```
📅 [Período de Teste] 2 dias restantes
   Aproveite todos os recursos premium até 25/12/2024. Não perca o acesso!
   [Fazer Upgrade]
```

### Last Day (Red)

```
⚠️ [Período de Teste] Último dia!
   Aproveite todos os recursos premium até 25/12/2024. Não perca o acesso!
   [Assinar Agora]
```
