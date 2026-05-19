import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function OrdersListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-caramel/8 last:border-0">
          <div className="w-9 h-9">
            <Skeleton className="w-9 h-9 rounded-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-3 w-24 rounded-full ml-2" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-2/3 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrdersListSkeleton;
