"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Create a client instance outside the component, so it's not re-created on re-renders
const queryClient = new QueryClient();

export function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}