"use client";

import useSignUpForm from "@/features/user/signup/useSignUpForm";
import SubmitButton from "@/shared/ui/submit-button";
import { Card } from "@/shared/ui/card";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/shared/ui/form"
import { Input } from "@/shared/ui/input"
import { useTranslations } from "next-intl";

export default function SignUpLayout() {
    const t = useTranslations();
    const { isLoading, form, onSubmit } = useSignUpForm();

    return (
        <>
            <Card className="col-span-4 md:col-start-3 lg:col-start-5 p-4 mb-4 shadow-md hover:shadow-lg border-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("user.email")}</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("user.displayName")}</FormLabel>
                                    <FormControl>
                                        <Input type="text" {...field} />
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
                                    <FormLabel>{t("user.password")}</FormLabel>
                                    <FormControl>
                                        <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <SubmitButton
                                isLoading={isLoading}
                                text={t("common.next")}
                            />
                        </div>
                    </form>
                </Form>
            </Card>
        </>
    )
}