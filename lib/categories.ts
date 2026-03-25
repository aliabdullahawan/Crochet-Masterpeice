// Categories are loaded from Supabase at runtime
// This file only defines the TypeScript interface

export interface CategoryData {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  active: boolean;
  sort_order: number;
  count?: number;
  bgColor?: string;
}

// Empty — populated from Supabase in each component that uses categories
export const SHARED_CATEGORIES: CategoryData[] = [];
