"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { useEffect, useState } from "react"
import { useUser } from "@/context/user-context"

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }).regex(/^[a-zA-Z0-9]+$/, {
    message: "Username must contain only letters and numbers, no spaces.",
  }),
  email: z.string().email().refine(email => email.endsWith('@gmail.com'), {
    message: "Email must be a @gmail.com address."
  }),
  password: z.string().min(9, {
    message: "Password must be at least 9 characters.",
  }).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{9,}$/, {
    message: "Password must contain both letters and numbers."
  }),
  referralCode: z.string().optional(),
})

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { signUp } = useUser()
  const [isClient, setIsClient] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      referralCode: "",
    },
  })

  useEffect(() => {
    setIsClient(true)
    const refCode = searchParams.get('ref')
    if (refCode) {
      form.setValue('referralCode', refCode)
    }
  }, [searchParams, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const result = signUp(values);

    if (result.success) {
      toast({
        title: "Account Created!",
        description: "Welcome to Serpens Fortuna. You can now sign in.",
      })
      
      if (result.bonus) {
          setTimeout(() => {
              toast({
                  title: "Welcome Gift!",
                  description: `You've received a $${result.bonus.toFixed(2)} bonus to start playing!`,
              });
          }, 1000);
      }

      router.push("/")
    } else {
      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: result.message,
      })
    }
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <CardTitle className="font-headline text-4xl">Create an Account</CardTitle>
            </div>
            <CardDescription>Join the fun and start your adventure</CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@gmail.com" {...field} />
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
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="FRIEND_CODE" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full">Sign Up</Button>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Sign In
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
