import { useState, useCallback } from "react";
import { useToast } from "./use-toast";

export interface CompareProperty {
  id: string;
  title: string;
  price_usd: number;
  county: string;
  photos: string[];
  listing_type: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  square_yards?: number;
  address?: string;
  description?: string;
}

const MAX_COMPARE_ITEMS = 4;

export function usePropertyComparison() {
  const { toast } = useToast();
  const [compareList, setCompareList] = useState<CompareProperty[]>([]);

  const addToCompare = useCallback((property: CompareProperty) => {
    setCompareList((prev) => {
      if (prev.find((p) => p.id === property.id)) {
        toast({
          title: "Already Added",
          description: "This property is already in your comparison list",
        });
        return prev;
      }

      if (prev.length >= MAX_COMPARE_ITEMS) {
        toast({
          title: "Limit Reached",
          description: `You can compare up to ${MAX_COMPARE_ITEMS} properties at a time`,
          variant: "destructive",
        });
        return prev;
      }

      toast({
        title: "Added to Compare",
        description: `${property.title} added to comparison`,
      });
      return [...prev, property];
    });
  }, [toast]);

  const removeFromCompare = useCallback((propertyId: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== propertyId));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  const isInCompare = useCallback((propertyId: string) => {
    return compareList.some((p) => p.id === propertyId);
  }, [compareList]);

  return {
    compareList,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    compareCount: compareList.length,
    maxItems: MAX_COMPARE_ITEMS,
  };
}
