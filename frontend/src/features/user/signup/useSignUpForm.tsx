"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import SignUpSchema from "./SignUpSchema"
import { signUp } from "@/entities/user/api/userApi"

export default function useSignUpForm() {
  // 1. Define your form.
  const formSchema = SignUpSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      password: ""
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    signUp({
      email: values.email,
      username: values.username,
      password: values.password
    })
  }

  return {
    form,
    onSubmit
  }
}