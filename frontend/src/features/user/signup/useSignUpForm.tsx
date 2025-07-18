"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import SignUpSchema from "./SignUpSchema"
import { signUp } from "@/entities/user/api/userApi"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "@/shared/lib/i18n"

export default function useSignUpForm() {
  const { t } = useTranslation();
  const [ isLoading, setIsLoading ] = useState<boolean>(false);
  const router = useRouter();

  // 1. Define your form.
  const formSchema = SignUpSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    setIsLoading(true);

    signUp({
      email: values.email,
      password: values.password
    }).then(() => {
      router.push("/");
      toast(t("user.waitForApproval"));
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