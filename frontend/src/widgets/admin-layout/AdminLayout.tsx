"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "@/shared/lib/i18n";
import { Card } from "@/shared/ui/card";
import { createClient } from "@/shared/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { UserMetadata } from "@supabase/supabase-js";

export default function AdminLayout({ userMetadata } : { userMetadata: UserMetadata }) {
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
            href: "/admin/post/new",
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
        <Card className="col-span-4 md:col-start-3 lg:col-start-5 p-4 mb-4 shadow-md hover:shadow-lg border-0">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-2">
                            {t("admin.greeting", {"name": userMetadata.username })}
                        </h1>
                        <p className="text-sm">
                            {t("admin.title")}
                        </p>
                    </div>

                    {/* Admin Links */}
                    <div className="space-y-4">
                        {adminLinks.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => router.push(link.href)}
                                className="w-full text-left p-4 rounded-lg border hover:bg-foreground hover:text-background transition-colors duration-200"
                            >
                                <div className="font-medium mb-1">
                                    {link.title}
                                </div>
                                <div className="text-sm">
                                    {link.description}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Logout Button */}
                    <div className="pt-4">
                        <Button
                            onClick={handleLogout}
                            className="w-full p-3 rounded-lg"
                        >
                            {t("admin.logout")}
                        </Button>
                    </div>
                </div>
            </Card>
    );
}