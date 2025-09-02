import { Label } from "@/components/ui/label";
import { useSharedUsers } from "@/hooks/useSharedUsers";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface SharedUserSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function SharedUserSelector({ 
  value, 
  onChange, 
  label = "Quem está registrando?",
  placeholder = "Selecione quem está registrando"
}: SharedUserSelectorProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { sharedUsers } = useSharedUsers();

  const options = [
    // Usuário atual (dono da conta)
    {
      id: "",
      name: profile?.name || user?.email?.split('@')[0] || "Você",
      type: "owner"
    },
    // Usuários compartilhados
    ...sharedUsers.map(sharedUser => ({
      id: sharedUser.id,
      name: sharedUser.name,
      type: "shared"
    }))
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="shared-user-select">{label}</Label>
      <select
        id="shared-user-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} {option.type === "owner" ? "(Você)" : "(Compartilhado)"}
          </option>
        ))}
      </select>
    </div>
  );
}
