"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

export function CartIcon() {
  const { items } = useCart()
  const totalItems = items.length

  return (
    <Link href="/dashboard/user/cart">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
          >
            {totalItems}
          </Badge>
        )}
      </Button>
    </Link>
  )
} 