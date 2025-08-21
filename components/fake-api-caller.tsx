"use client";

import { useEffect } from "react";

export function FakeApiCaller() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Random API call to example.com that will fail
      console.log("Making client-side API call to example.com...");

      fetch("https://example.com/api/nonexistent-endpoint", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            console.error(
              "Client API call failed with status:",
              response.status,
            );
            throw new Error(`Client API call failed: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Client API call successful:", data);
        })
        .catch((error) => {
          console.error(
            "Client-side random API call to example.com failed:",
            error,
          );
        });
    }, 2000); // 2 seconds delay

    return () => clearTimeout(timer);
  }, []);

  // This component doesn't render anything
  return null;
}
