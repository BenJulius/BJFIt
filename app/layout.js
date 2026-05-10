import "./globals.css"
import AppShell from "@/components/AppShell"

export const metadata = {
  title: "BJ Fit",
  applicationName: "BJ Fit",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
  },
}

export const viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex justify-center bg-zinc-950">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
