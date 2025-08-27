"use client"

import { z } from "zod"
import { preventXSS, sanitizeEmailInput } from '@/shared/lib/sanitization';
import { useTranslations } from "next-intl"

export default function SignInSchema() {
    const t = useTranslations("user");

    return z.object({
        email: z.string()
            .email({ message: t("wrongEmail") })
            .refine(preventXSS, { message: t("invalidCharacters") })
            .transform(sanitizeEmailInput),
        password: z.string()
            .min(1, { message: t("passwordRequired") })
            .refine(preventXSS, { message: t("invalidCharacters") }),
    })
}