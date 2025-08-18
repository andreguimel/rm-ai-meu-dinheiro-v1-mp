import { Moon, Sun, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro'
      case 'dark':
        return 'Escuro'
      case 'system':
        return 'Sistema'
      default:
        return 'Tema'
    }
  }

  // Switch entre claro/escuro; still keep label for screen-readers
  const isDark = theme === "dark"

  return (
    <div className="flex items-center gap-2">
      <Sun className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-yellow-400"}`} />
      <Switch
        aria-label="Alternar tema claro/escuro"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="bg-border"
      />
      <Moon className={`w-4 h-4 ${isDark ? "text-indigo-200" : "text-gray-400"}`} />
    </div>
  )
}