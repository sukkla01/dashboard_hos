"use client";

const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

/** FOUC prevention — render inline script only during SSR, not on client hydration (React 19). */
export function ThemeScript() {
  if (typeof window !== "undefined") {
    return null;
  }

  return (
    <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
  );
}
