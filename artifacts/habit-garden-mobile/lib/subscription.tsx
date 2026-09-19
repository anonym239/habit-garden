import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases from "react-native-purchases";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useUser } from "@clerk/expo";
import { getGetBillingStatusQueryKey, useGetBillingStatus } from "@workspace/api-client-react";

const REVENUECAT_TEST_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const REVENUECAT_ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export const REVENUECAT_ENTITLEMENT_IDENTIFIER = "pro";

function getRevenueCatApiKey() {
  if (__DEV__ || Platform.OS === "web" || Constants.executionEnvironment === "storeClient") {
    return REVENUECAT_TEST_API_KEY;
  }
  if (Platform.OS === "android") {
    return REVENUECAT_ANDROID_API_KEY;
  }
  return REVENUECAT_TEST_API_KEY;
}

export function initializeRevenueCat() {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("RevenueCat Public API Key not found");
    return;
  }
  
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  console.log("Configured RevenueCat");
}

function useSubscriptionContext() {
  const { user } = useUser();
  const stripeStatusQuery = useGetBillingStatus({
    query: {
      queryKey: [...getGetBillingStatusQueryKey(), user?.id ?? "signed-out"],
      enabled: !!user?.id,
      staleTime: 60 * 1000,
    },
  });
  const customerInfoQuery = useQuery({
    queryKey: ["revenuecat", "customer-info"],
    queryFn: async () => {
      const info = await Purchases.getCustomerInfo();
      return info;
    },
    staleTime: 60 * 1000,
  });

  const offeringsQuery = useQuery({
    queryKey: ["revenuecat", "offerings"],
    queryFn: async () => {
      const offerings = await Purchases.getOfferings();
      return offerings;
    },
    staleTime: 300 * 1000,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    Purchases.logIn(user.id)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["revenuecat", "customer-info"] });
        queryClient.invalidateQueries({ queryKey: ["revenuecat", "offerings"] });
      })
      .catch((error) => console.warn("RevenueCat login failed", error));
  }, [queryClient, user?.id]);

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: any) => {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenuecat", "customer-info"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      return Purchases.restorePurchases();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenuecat", "customer-info"] });
    },
  });

  const hasRevenueCatPro = customerInfoQuery.data?.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
  const isPro = hasRevenueCatPro || stripeStatusQuery.data?.isPro === true;

  return {
    customerInfo: customerInfoQuery.data,
    offerings: offeringsQuery.data,
    isPro,
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading || (!!user?.id && stripeStatusQuery.isLoading),
    purchase: purchaseMutation.mutateAsync,
    restore: restoreMutation.mutateAsync,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
  };
}

type SubscriptionContextValue = ReturnType<typeof useSubscriptionContext>;
const Context = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const value = useSubscriptionContext();
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubscription() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return ctx;
}
