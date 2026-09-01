import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { useThemeStore } from "@/shared/lib/theme-store"

// RF-04: gerador do shadcn assume next-themes (Next.js) — este projeto não usa Next, o tema é
// o store Zustand próprio (`dispatch-tema`, mesmo usado pelo alternador da sidebar). Sem essa
// troca o toast ficaria sempre em "system", ignorando a troca manual de tema do usuário.
const Toaster = ({ ...props }: ToasterProps) => {
  const tema = useThemeStore((state) => state.tema)

  return (
    <Sonner
      theme={tema}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
