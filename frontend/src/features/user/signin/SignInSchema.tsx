"use client"

import { z } from "zod"
import { useTranslation } from '@/shared/lib/i18n';
import { preventXSS, sanitizeEmailInput } from '@/shared/lib/sanitization';

export default function SignInSchema() {
    const { t } = useTranslation();

    return z.object({
        email: z.string()
            .email({ message: t("user.wrongEmail") })
            .refine(preventXSS, { message: t("user.invalidCharacters") })
            .transform(sanitizeEmailInput),
        password: z.string()
            .min(1, { message: t("user.passwordRequired") })
            .refine(preventXSS, { message: t("user.invalidCharacters") }),
    })
}