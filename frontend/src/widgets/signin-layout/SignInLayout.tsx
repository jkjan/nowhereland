"use client";

import useSignInForm from "@/features/user/signin/useSignInForm";
import { useTranslation } from "@/shared/lib/i18n";
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

export default function SignInLayout() {
    const { t } = useTranslation();
    const { isLoading, form, onSubmit } = useSignInForm();

    return (
        <>
            <Card className="col-span-4 md:col-start-3 lg:col-start-5 p-4 mb-4 shadow-md hover:shadow-lg border-0 bg-white text-black">
            <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-black mb-2">
                            {t("admin.signin")}
                        </h1>
                    </div>


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
                                text={t("common.signIn")}
                            />
                        </div>
                    </form>
                </Form>
                </div>
            </Card>
        </>
    )
}