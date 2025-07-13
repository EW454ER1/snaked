"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/icons"
import { useUser } from "@/context/user-context"
import { useEffect } from "react"

const formSchema = z.object({
  email: z.string().min(1, {
    message: "Email or Username is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
})

export default function SignInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login, user, isInitialized } = useUser()

  // Redirect if user is already logged in
  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/lobby');
    }
  }, [user, isInitialized, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const success = login(values.email, values.password)

    if (success) {
      toast({
        title: "Welcome Back!",
        description: "You have been successfully signed in.",
      })
      router.push("/lobby")
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials or account suspended.",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-4xl">Serpens Fortuna</CardTitle>
            </div>
            <CardDescription>Sign in to your account to play</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Username</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com or yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="•••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full">Sign In</Button>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/sign-up" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Sign Up
                  </Link>
                </div>
                <div className="text-center text-xs text-muted-foreground pt-2">
                  <Link href="/admin/login" className="hover:underline">
                    Admin Panel
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  )
}
