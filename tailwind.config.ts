import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // IPDR 브랜드 색상 시스템
        brand: {
          50: "#E6F3FF",
          100: "#CCE7FF",
          200: "#99CFFF",
          300: "#66B7FF",
          400: "#339FFF",
          500: "#007AFF", // 메인 브랜드 색상 (Apple Blue)
          600: "#0056CC",
          700: "#003D99",
          800: "#002866",
          900: "#001433",
        },
        // 확장된 색상 시스템 (ConversationalAnalysis에서 사용)
        primary: {
          50: "#E6F3FF",
          100: "#CCE7FF", 
          200: "#99CFFF",
          300: "#66B7FF",
          400: "#339FFF",
          500: "#007AFF", // 메인 브랜드 컬러 매핑
          600: "#0056CC",
          700: "#003D99",
          800: "#002866",
          900: "#001433",
          DEFAULT: "#007AFF", // shadcn/ui 호환성
          foreground: "#FFFFFF",
        },
        neutral: {
          50: "#F8F9FA",   // 배경
          100: "#F1F3F4",  // 카드 배경
          200: "#E5E8EB",  // 테두리
          300: "#D1D5DB",  // 비활성화된 요소
          400: "#9CA3AF",  // 플레이스홀더
          500: "#8B95A1",  // 보조 텍스트
          600: "#6B7280",  // 일반 텍스트
          700: "#4B5563",  // 강조 텍스트
          800: "#374151",  // 제목
          900: "#191F28"   // 메인 텍스트
        },
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#34C759",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D"
        },
        warning: {
          50: "#FFFBEB", 
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#FF9500",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F"
        },
        error: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#FF3B30",
          600: "#DC2626", 
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D"
        },
        info: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#5AC8FA",
          600: "#3B82F6",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A"
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "slideDown": {
          from: {
            opacity: "0",
            transform: "translateY(-20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slideDown": "slideDown 0.5s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config