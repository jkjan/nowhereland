"use client"

import { z } from "zod"
import { preventXSS, sanitizeEmailInput, sanitizeInput } from '@/shared/lib/sanitization';
import { useTranslations } from "next-intl";

export default function SignUpSchema() {
    const t = useTranslations("user");

    return z.object({
        email: z.string()
            .email({ message: t("wrongEmail") })
            .refine(preventXSS, { message: t("invalidCharacters") })
            .transform(sanitizeEmailInput),
        password: z.string()
            .min(8, { message: t("wrongPassword") })
            .max(64)
            .refine(preventXSS, { message: t("invalidCharacters") }),
        displayName: z.string()
            .min(1, { message: t("wrongDisplayName") })
            .max(50)
            .refine(preventXSS, { message: t("invalidCharacters") })
            .transform(sanitizeInput),
    })
}