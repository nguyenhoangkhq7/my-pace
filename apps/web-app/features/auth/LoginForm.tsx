import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  return (
    <Card className="border-slate-800 bg-pace-card shadow-md">
      <CardHeader className="space-y-2">
        <h1 className="text-lg font-semibold text-slate-100">Sign in</h1>
        <p className="text-sm text-slate-300">
          Use your email and password to continue.
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-5">
          <div className="space-y-2">
            <Label className="text-slate-200" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-9 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200" htmlFor="password">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              className="h-9 text-sm"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-pace-accent text-slate-900 transition hover:bg-pace-accent/90 active:scale-95"
          >
            Sign in
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between text-xs text-pace-muted">
        <span>New here?</span>
        <Link
          className="rounded px-1 transition hover:bg-slate-800 hover:text-slate-100 active:scale-95"
          href="/register"
        >
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}
