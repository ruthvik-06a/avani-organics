"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/products"
import { addToCart } from "@/lib/cart-store"
import { toast } from "sonner"

export function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addToCart(product)
    toast.success(`${product.name} added to cart`)
  }

  return (
    <Link href={`/shop/${product.id}`} className="group block">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-secondary">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {discount > 0 && (
              <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                {`${discount}% OFF`}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {product.category}
            </p>
            <h3 className="font-serif text-lg font-semibold leading-tight text-card-foreground transition-colors group-hover:text-primary">
              {product.name}
            </h3>
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-card-foreground">
                {product.rating}
              </span>
              <span className="text-xs text-muted-foreground">
                ({product.reviews})
              </span>
            </div>

            {/* Price + Order */}
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-card-foreground">
                  {`\u20B9${product.price}`}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {`\u20B9${product.originalPrice}`}
                  </span>
                )}
              </div>
              <Button
                size="icon"
                onClick={handleAddToCart}
                className="size-9 rounded-full"
              >
                <ShoppingCart className="size-4" />
                <span className="sr-only">Add to cart</span>
              </Button>
            </div>
          </div>
        </div>
      </Link>
  )
}
