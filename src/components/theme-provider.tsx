import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "shadcn-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get theme from localStorage first
    const storedTheme = localStorage.getItem(storageKey) as Theme;
    if (storedTheme && ["dark", "light"].includes(storedTheme)) {
      return storedTheme;
    }
    
    // Fallback to system theme if nothing found
    return window.matchMedia("(prefers-color-scheme: dark)").matches 
      ? "dark" 
      : defaultTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove("light", "dark");
    
    // Apply new theme class
    if (theme !== "system") {
      root.classList.add(theme);
    }
    
    // Handle system theme
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const applySystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        const isDark = e.matches;
        root.classList.toggle("dark", isDark);
        root.classList.toggle("light", !isDark);
      };
      
      mediaQuery.addEventListener("change", applySystemTheme);
      applySystemTheme(mediaQuery);
      
      return () => mediaQuery.removeEventListener("change", applySystemTheme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
};