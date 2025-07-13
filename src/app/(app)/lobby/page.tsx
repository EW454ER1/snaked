
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, X, Gift, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useUser } from "@/context/user-context"
import { useToast } from "@/hooks/use-toast"
import { gameTables } from "@/lib/game-data"
import { useTranslation } from "react-i18next"

const ReferralBanner = ({ onDismiss }: { onDismiss: () => void }) => {
    const router = useRouter();
    const { t } = useTranslation();
    return (
        <div className="relative mb-8 rounded-lg border border-primary/20 bg-gradient-to-tr from-primary/10 via-background to-accent/10 p-6 overflow-hidden">
             <div className="absolute -top-4 -right-4 w-24 h-24 text-primary/10">
                <Gift className="w-full h-full" />
            </div>
            <button onClick={onDismiss} className="absolute top-2 right-2 text-foreground/50 hover:text-foreground">
                <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-shrink-0 text-primary">
                     <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-round-plus"><path d="M2 21a8 8 0 0 1 13.292-6"/><circle cx="10" cy="8" r="5"/><path d="M18 15h6"/><path d="M21 12v6"/></svg>
                </div>
                <div className="flex-grow">
                    <h3 className="font-headline text-2xl font-bold text-primary">{t('lobby.referral.title')}</h3>
                    <p className="text-muted-foreground mt-1">
                        {t('lobby.referral.description')}
                    </p>
                </div>
                <Button onClick={() => router.push('/referrals')} size="lg" className="flex-shrink-0 w-full md:w-auto">
                    <Share2 className="mr-2 h-5 w-5" />
                    {t('lobby.referral.button')}
                </Button>
            </div>
        </div>
    )
}


export default function LobbyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showReferralAlert, setShowReferralAlert] = useState(true);
  const { wallet, spend } = useUser()
  const { t } = useTranslation();

  if (!wallet) return null

  const handleEnterTable = (tableId: number, bet: number) => {
    if (bet === 0) {
      router.push(`/game/${tableId}`);
      return;
    }
    
    if (spend(bet)) {
      router.push(`/game/${tableId}`);
    } else {
      toast({
        variant: "destructive",
        title: t('toast.insufficientFunds.title'),
        description: t('toast.insufficientFunds.description'),
      });
    }
  };

  return (
    <div className="container mx-auto">
      <div className="space-y-4 mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">{t('lobby.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('lobby.description')} <span className="font-bold text-primary">${wallet.balance.toFixed(2)}</span></p>
      </div>

      {showReferralAlert && (
        <ReferralBanner onDismiss={() => setShowReferralAlert(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gameTables.map((table) => (
          <Card key={table.id} className="flex flex-col hover:shadow-lg hover:border-primary transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{t(`gameTables.${table.id}.name`)}</CardTitle>
              <CardDescription>{t(`gameTables.${table.id}.required`)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{t('lobby.foodValue')}: ${table.minFoodValue.toFixed(4)} - ${table.maxFoodValue.toFixed(4)}</p>
            </CardContent>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" variant={table.bet > 0 ? 'default' : 'secondary'} disabled={wallet.balance < table.bet && table.bet > 0}>
                    {wallet.balance < table.bet && table.bet > 0 ? t('lobby.insufficientFunds') : t('lobby.enterTable')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('lobby.dialog.title', { tableName: t(`gameTables.${table.id}.name`) })}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {table.bet > 0 
                        ? t('lobby.dialog.betDescription', { betAmount: table.bet })
                        : t('lobby.dialog.freeDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleEnterTable(table.id, table.bet)}>
                      {t('common.confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
