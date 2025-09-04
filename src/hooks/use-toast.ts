"use client"

import { toast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const showToast = ({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      toast.error(title || "Erro", {
        description,
      })
    } else {
      toast.success(title || "Sucesso", {
        description,
      })
    }
  }

  return {
    toast: showToast,
  }
}

// Exporta também a função toast diretamente do sonner para casos mais específicos
export { toast }