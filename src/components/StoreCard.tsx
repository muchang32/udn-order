import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useLogoColor } from "@/hooks/useLogoColor";

interface StoreCardProps {
  store: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

export const StoreCard = forwardRef<HTMLAnchorElement, StoreCardProps>(
  ({ store }, ref) => {
    const logoColor = useLogoColor(store.logo_url);

    return (
      <Link
        ref={ref}
        to={`/store/${store.id}`}
        className="group block bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
      >
        <div
          className="h-24 flex items-center justify-center transition-colors"
          style={{ backgroundColor: logoColor }}
        >
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="h-16 w-auto object-contain"
              crossOrigin="anonymous"
            />
          ) : (
            <Store className="w-12 h-12 text-white/90" />
          )}
        </div>
        <div className="p-4">
          <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
            {store.name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">點擊進入點餐</p>
        </div>
      </Link>
    );
  }
);

StoreCard.displayName = "StoreCard";