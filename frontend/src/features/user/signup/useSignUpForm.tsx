"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import SignUpSchema from "./SignUpSchema"
import { signUp } from "@/entities/user/api/userApi"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function useSignUpForm() {
  const [ isLoading, setIsLoading ] = useState<boolean>(false);
  const router = useRouter();

  // 1. Define your form.
  const formSchema = SignUpSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: ""
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setIsLoading(true);

    signUp({
      email: values.email,
      password: values.password,
      displayName: values.displayName
    }).then(() => {
      router.push("/admin/signup/pending");
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsLoading(false);
    })
  }

  return {
    isLoading,
    form,
    onSubmit
  }
}