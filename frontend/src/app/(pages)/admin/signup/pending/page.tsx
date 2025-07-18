"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/shared/lib/i18n";
import { Card } from "@/shared/ui/card";

export default function SignupPendingPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push("/");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
            <Card className="col-span-4 md:col-start-3 lg:col-start-5 p-8 text-center shadow-md border-0 bg-white text-black max-w-md w-full">
                <div className="space-y-6">
                    <div className="text-6xl mb-4">✅</div>
                    
                    <h1 className="text-2xl font-bold text-green-600 mb-4">
                        {t("user.signupSuccess")}
                    </h1>
                    
                    <p className="text-gray-600 mb-6">
                        {t("user.waitForApproval")}
                    </p>
                    
                    <div className="bg-gray-100 rounded-lg p-4">
                        <p className="text-sm text-gray-500">
                            {t("user.redirectIn", { seconds: countdown })}
                        </p>
                        
                        <div className="mt-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear" 
                                 style={{ width: `${(countdown / 5) * 100}%` }}>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
    );
}