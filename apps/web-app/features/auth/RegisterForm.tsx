import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
    return (
        <Card className="border-slate-800 bg-pace-card shadow-md">
            <CardHeader className="space-y-2">
                <h1 className="text-lg font-semibold text-slate-100">Create account</h1>
                <p className="text-sm text-slate-300">
                    Join MyPACE with a few quick details.
                </p>
            </CardHeader>
            <CardContent>
                <form className="space-y-5">
                    <div className="space-y-2">
                        <Label className="text-slate-200" htmlFor="fullName">
                            Full name
                        </Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            placeholder="Your full name"
                            className="h-9 text-sm"
                            required
                        />
                    </div>
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
                            autoComplete="new-password"
                            placeholder="Create a password"
                            className="h-9 text-sm"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-200" htmlFor="confirmPassword">
                            Confirm password
                        </Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Repeat your password"
                            className="h-9 text-sm"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-pace-accent text-slate-900 transition hover:bg-pace-accent/90 active:scale-95"
                    >
                        Create account
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-between text-xs text-pace-muted">
                <span>Already have an account?</span>
                <Link
                    className="rounded px-1 transition hover:bg-slate-800 hover:text-slate-100 active:scale-95"
                    href="/login"
                >
                    Sign in
                </Link>
            </CardFooter>
        </Card>
    );
}

