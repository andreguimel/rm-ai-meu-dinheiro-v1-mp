import { Sun } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Componente desabilitado - apenas modo claro
export function ThemeToggle() {
  return (
    <div className="flex items-center gap-2">
      <Sun className="w-4 h-4 text-yellow-400" />
      <Badge variant="secondary" className="text-xs">
        Modo Claro
      </Badge>
    </div>
  )
}