'use client';

import { useTranslation } from '@/shared/lib/i18n';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/shared/lib/supabase/client';

export default function PendingPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="col-span-4 md:col-start-3 lg:col-start-5 flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl">{t('admin.pending.title')}</CardTitle>
            <CardDescription>
              {t('admin.pending.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  <p className="font-medium">{t('admin.pending.accountCreated')}</p>
                  <p>{t('admin.pending.waitingForApproval')}</p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{t('admin.pending.explanation')}</p>
              <p>{t('admin.pending.contactInfo')}</p>
            </div>

            <div className="pt-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleLogout}
              >
                {t('admin.logout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}