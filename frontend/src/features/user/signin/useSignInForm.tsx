"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import SignInSchema from "./SignInSchema"
import { signIn } from "@/entities/user/api/userApi"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useTranslation } from "@/shared/lib/i18n"

export default function useSignInForm() {
  const { t } = useTranslation();
  const [ isLoading, setIsLoading ] = useState<boolean>(false);
  const router = useRouter();

  const formSchema = SignInSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: ""
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    signIn({
      email: values.email,
      password: values.password
    }).then(() => {
      router.push("/admin");
      toast(t("user.signInSuccess"));
    }).catch((err) => {
      console.error(err);
      toast.error(err.message || t("user.signInError"));
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