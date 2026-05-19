import React from "react";
import OrdersListSkeleton from "@/components/ui/OrdersListSkeleton";

export function LoadingWrapper({
  loading,
  skeleton,
  children,
}: {
  loading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}) {
  if (loading) return <>{skeleton ?? <OrdersListSkeleton />}</>;
  return <>{children}</>;
}

export default LoadingWrapper;
