"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/shared/lib/i18n";
import { Card } from "@/shared/ui/card";
import { createClient } from "@/shared/lib/supabase/client";
import { toast } from "sonner";

export default function AdminLayout() {
    const { t } = useTranslation();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                toast.error(t("admin.logoutError"));
            } else {
                toast.success(t("admin.logoutSuccess"));
                router.push("/");
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast.error(t("admin.logoutError"));
        }
    };

    const adminLinks = [
        {
            title: t("admin.writePost"),
            href: "/admin/post/write",
            description: t("admin.writePostDesc")
        },
        {
            title: t("admin.settings"),
            href: "/admin/settings",
            description: t("admin.settingsDesc")
        },
        {
            title: t("admin.dashboard"),
            href: "/admin/dashboard",
            description: t("admin.dashboardDesc")
        }
    ];

    return (
            <Card className="col-span-4 md:col-start-3 lg:col-start-5 p-8 shadow-md border-0 bg-white text-black max-w-md w-full">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-black mb-2">
                            {t("admin.title")}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {t("admin.subtitle")}
                        </p>
                    </div>

                    {/* Admin Links */}
                    <div className="space-y-4">
                        {adminLinks.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => router.push(link.href)}
                                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <div className="font-medium text-black mb-1">
                                    {link.title}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {link.description}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="w-full p-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors duration-200"
                        >
                            {t("admin.logout")}
                        </button>
                    </div>
                </div>
            </Card>
    );
}