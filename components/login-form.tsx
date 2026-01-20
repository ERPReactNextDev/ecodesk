"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { Globe, Calendar } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [Email, setEmail] = useState("");
  const [Password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockUntil, setLockUntil] = useState<string | null>(null);

  const { setUserId } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (lockUntil) {
      toast.error(
        `Account locked! Try again after ${new Date(lockUntil).toLocaleString()}`
      );
    }
  }, [lockUntil]);

  const playSound = (file: string) => {
    const audio = new Audio(file);
    audio.play().catch(() => {});
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  const getLocation = async () => {
    if (!navigator.geolocation) return null;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return null;
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!Email || !Password) {
        toast.error("All fields are required!");
        return;
      }

      setLoading(true);

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Email, Password }),
        });

        const text = await response.text();
        let result: any;

        try {
          result = JSON.parse(text);
        } catch {
          toast.error("Invalid server response.");
          playSound("/login-failed.mp3");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          if (result.lockUntil) {
            setLockUntil(result.lockUntil);
          } else {
            toast.error(result.message || "Login failed!");
          }
          playSound("/reset.mp3");
          setLoading(false);
          return;
        }

        // ❌ NOT CSR
        if (result.Department !== "CSR") {
          toast.error("Only CSR department users are allowed to log in.");
          playSound("/login-failed.mp3");
          setLoading(false);
          return;
        }

        // ❌ RESIGNED / TERMINATED
        if (result.Status === "Resigned" || result.Status === "Terminated") {
          toast.error(`Your account is ${result.Status}. Login not allowed.`);
          playSound("/login-failed.mp3");
          setLoading(false);
          return;
        }

        // ✅ SUCCESS — ACTIVITY LOG
        const deviceId = getDeviceId();
        const location = await getLocation();

        await addDoc(collection(db, "activity_logs"), {
          email: Email,
          status: "login",
          timestamp: new Date().toISOString(),
          deviceId,
          location,
          userId: result.userId,
          browser: navigator.userAgent,
          os: navigator.platform,
          date_created: serverTimestamp(),
        });

        toast.success("Login successful!");
        playSound("/login.mp3");

        setUserId(result.userId);
        router.push(`/dashboard?id=${encodeURIComponent(result.userId)}`);
      } catch (error) {
        console.error("Login error:", error);
        toast.error("An error occurred during login.");
        playSound("/login-failed.mp3");
      } finally {
        setLoading(false);
      }
    },
    [Email, Password, router, setUserId]
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground">
                  Login to your Ecodesk account
                </p>
              </div>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="m@taskflow.com"
                  value={Email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel>Password</FieldLabel>
                  <a
                    href="/reset-password"
                    className="ml-auto text-sm hover:underline"
                  >
                    Forgot?
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={Password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </Field>

              <FieldSeparator>Or continue with</FieldSeparator>

              <FieldDescription className="text-center">
                Don&apos;t have an account? <a href="#">Sign up</a>
              </FieldDescription>
            </FieldGroup>

            <div className="text-xs space-y-2 mt-4 text-center">
              <p className="flex items-center justify-center gap-1">
                <Globe size={14} />
                <Link
                  href="https://www.disruptivesolutionsinc.com/"
                  className="underline text-green-700"
                >
                  disruptivesolutionsinc.com
                </Link>
              </p>
              <p className="flex items-center justify-center gap-1">
                <Calendar size={14} />
                <Link
                  href="https://acculog.vercel.app/Login"
                  className="underline text-green-700"
                >
                  Acculog
                </Link>
              </p>
            </div>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img
              src="/ecoshift-wallpaper.jpg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
