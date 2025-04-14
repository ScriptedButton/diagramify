"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tools = {
  aoa: {
    title: "AOA Diagrams",
    description:
      "Create and analyze Activity-on-Arrow network diagrams for project planning",
    href: "/diagram",
  },
  earnedValue: {
    title: "Earned Value Analysis",
    description:
      "Calculate and track project performance metrics including CPI, SPI, and variance analysis",
    href: "/ev",
  },
} as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(tools).map(([key, tool]) => (
            <Link key={key} href={tool.href}>
              <Card className="h-full hover:bg-primary/5 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{tool.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
