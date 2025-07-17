"use client";

import { getAdminExists } from "@/entities/user/api";
import SignUpLayout from "@/widgets/signup-layout/SignUpLayout";
import { forbidden } from "next/navigation";

export default function SignUpPage() {
    const adminExists = getAdminExists();

    if (adminExists) {
        forbidden();
    } else {
        return SignUpLayout();
    }
}