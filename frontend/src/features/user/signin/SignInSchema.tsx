"use client"

import { z } from "zod"
import { useTranslation } from '@/shared/lib/i18n';

export default function SignInSchema() {
    const { t } = useTranslation();

    return z.object({
        email: z.string().email({ message: t("user.wrongEmail") }),
        password: z.string().min(1, { message: t("user.passwordRequired") }),
    })
}