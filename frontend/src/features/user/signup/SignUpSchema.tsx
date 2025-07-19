"use client"

import { z } from "zod"
import { useTranslation } from '@/shared/lib/i18n';
import { preventXSS, sanitizeEmailInput, sanitizeInput } from '@/shared/lib/sanitization';

export default function SignUpSchema() {
    const { t } = useTranslation();

    return z.object({
        email: z.string()
            .email({ message: t("user.wrongEmail") })
            .refine(preventXSS, { message: t("user.invalidCharacters") })
            .transform(sanitizeEmailInput),
        password: z.string()
            .min(8, { message: t("user.wrongPassword") })
            .max(64)
            .refine(preventXSS, { message: t("user.invalidCharacters") }),
        displayName: z.string()
            .min(1, { message: t("user.wrongDisplayName") })
            .max(50)
            .refine(preventXSS, { message: t("user.invalidCharacters") })
            .transform(sanitizeInput),
    })
}