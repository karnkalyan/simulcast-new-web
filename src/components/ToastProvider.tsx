"use client";

import React from "react";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      containerStyle={{
        zIndex: 9999999,
        top: 20,
        right: 20,
      }}
      toastOptions={{
        duration: 5000,
        style: {
          zIndex: 9999999,
          background: "#2b0d3a",
          color: "#ffffff",
          border: "1px solid #e11d72",
          fontSize: "13px",
          fontWeight: 500,
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
