
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
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
import { useTranslation } from "react-i18next"

const SingleReviveArt = () => {
    const { t } = useTranslation();
    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-card-foreground/5 rounded-t-lg">
        <svg viewBox="0 0 100 60" className="w-full h-full">
            <text x="50" y="20" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="16" fontWeight="bold" fontFamily="Playfair Display, serif">{t('store.items.1.name')}</text>
            <path d="M30 45 Q 40 30, 50 45 T 70 45" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="72" cy="45" r="1.5" fill="hsl(var(--primary))" />
        </svg>
        </div>
    )
};

const DoubleReviveArt = () => {
    const { t } = useTranslation();
    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-card-foreground/5 rounded-t-lg">
        <svg viewBox="0 0 100 60" className="w-full h-full">
            <text x="50" y="20" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="16" fontWeight="bold" fontFamily="Playfair Display, serif">{t('store.items.2.name')}</text>
            <path d="M25 45 Q 35 30, 45 45 T 65 45 Q 75 60, 85 45" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="87" cy="45" r="1.5" fill="hsl(var(--primary))" />
        </svg>
        </div>
    )
};

const TripleReviveArt = () => {
    const { t } = useTranslation();
    return (
        <div className="w-full h-full flex items-center justify-center p-4 bg-card-foreground/5 rounded-t-lg">
        <svg viewBox="0 0 100 60" className="w-full h-full">
            <text x="50" y="20" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="16" fontWeight="bold" fontFamily="Playfair Display, serif">{t('store.items.3.name')}</text>
            <path d="M15 45 Q 25 30, 35 45 T 55 45 Q 65 30, 75 45 T 95 45" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
            <circle cx="97" cy="45" r="1.5" fill="hsl(var(--primary))" />
        </svg>
        </div>
    )
};

const ObstacleShieldArt = () => {
    const { t } = useTranslation();
    return (
    <div className="w-full h-full flex items-center justify-center p-4 bg-card-foreground/5 rounded-t-lg">
        <svg viewBox="0 0 100 60" className="w-full h-full">
        <text x="50" y="20" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="16" fontWeight="bold" fontFamily="Playfair Display, serif">{t('store.items.4.name')}</text>
        <path d="M50 32 C 40 34, 25 42, 25 55 L 50 60 L 75 55 C 75 42, 60 34, 50 32 Z" stroke="hsl(var(--accent))" strokeWidth="4" fill="hsl(var(--accent))" fillOpacity="0.2" strokeLinejoin="round" />
        </svg>
    </div>
    )
};


const storeItems = [
  {
    id: 1,
    name: "Single Revive",
    price: 20,
    description: "Gives you a second chance! Automatically revives your snake once upon death.",
    ArtComponent: SingleReviveArt,
    action: (addRevives: (count: number) => void) => addRevives(1),
  },
  {
    id: 2,
    name: "Double Revive",
    price: 35,
    description: "The ultimate comeback! Revives your snake twice in a single game.",
    ArtComponent: DoubleReviveArt,
    action: (addRevives: (count: number) => void) => addRevives(2),
  },
  {
    id: 3,
    name: "Triple Revive",
    price: 50,
    description: "Become nearly invincible. Three revives to secure your victory.",
    ArtComponent: TripleReviveArt,
    action: (addRevives: (count: number) => void) => addRevives(3),
  },
  {
    id: 4,
    name: "Obstacle Shield",
    price: 99,
    description: "Play one game without obstacles and get one extra revive.",
    ArtComponent: ObstacleShieldArt,
    action: (addRevives: (count: number) => void, addObstacleShield?: () => void) => {
      addObstacleShield?.();
      addRevives(1);
    },
  },
];

export default function StorePage() {
  const { toast } = useToast()
  const { wallet, spend, addRevives, addObstacleShield } = useUser();
  const { t } = useTranslation();
  
  if (!wallet) return null;

  const handlePurchase = (item: typeof storeItems[0]) => {
    if (spend(item.price)) {
      
      if(item.id === 4) {
        item.action(addRevives, addObstacleShield);
      } else {
        item.action(addRevives);
      }

      toast({
        title: t('toast.purchaseSuccess.title'),
        description: t('toast.purchaseSuccess.description', { itemName: t(`store.items.${item.id}.name`), price: item.price }),
      })

    } else {
      toast({
        variant: "destructive",
        title: t('toast.insufficientFunds.title'),
        description: t('toast.purchaseInsufficientFunds.description', { price: item.price, balance: wallet.balance.toFixed(2) }),
      })
    }
  }

  return (
    <div className="container mx-auto">
      <div className="space-y-4 mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">{t('store.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('store.description')} <span className="font-bold text-primary">${wallet.balance.toFixed(2)}</span></p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {storeItems.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col hover:shadow-lg hover:border-accent transition-all duration-300">
            <CardHeader className="p-0 h-40">
               <item.ArtComponent />
            </CardHeader>
            <CardContent className="p-4 flex-grow">
               <CardTitle className="font-headline text-xl mb-2">{t(`store.items.${item.id}.name`)}</CardTitle>
               <CardDescription>{t(`store.items.${item.id}.description`)}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
              <Badge variant="outline" className="text-lg font-bold border-primary text-primary">${item.price}</Badge>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={wallet.balance < item.price}>
                    {wallet.balance < item.price ? t('store.insufficientFunds') : t('store.buyNow')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('store.dialog.title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('store.dialog.description', { price: item.price, itemName: t(`store.items.${item.id}.name`) })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handlePurchase(item)}>
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
