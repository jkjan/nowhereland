"use client"

import { z } from "zod"
import { useTranslation } from '@/shared/lib/i18n';

export default function SignUpSchema() {
    const { t } = useTranslation();

    return z.object({
        email: z.email(t("user.wrongEmail")),
        username: z.string().min(2, t("user.wrongUsername")).max(50),
        password: z.string().min(8, t("user.wrongPassword")).max(64),
    })
}