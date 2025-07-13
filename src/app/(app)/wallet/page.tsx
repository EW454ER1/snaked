
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Image from 'next/image'
import { AlertTriangle, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/context/user-context"
import { Badge } from "@/components/ui/badge"
import { format, addMinutes, isAfter, differenceInSeconds } from "date-fns"
import { useTranslation } from "react-i18next"

export default function WalletPage() {
  const { t } = useTranslation();
  const { toast } = useToast()
  const walletAddress = "TDKeWZ7NZaEkQEVvvSKrdrMhC5V8P8b9cW"
  const { user, deposit, withdraw, getReferralStats, getTransactions, getQualifyingReferralsCount } = useUser()
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [depositProof, setDepositProof] = useState<File | null>(null);
  const [depositProofPreview, setDepositProofPreview] = useState<string>("");
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const qualifyingReferralsCount = getQualifyingReferralsCount();
  
  const eligibilityCheck = useMemo(() => {
      if (!user) return { isEligible: false, unlockTime: null };
      const isEligible = qualifyingReferralsCount >= 5;
      const unlockTime = isEligible && user.withdrawalUnlockTime 
        ? addMinutes(new Date(user.withdrawalUnlockTime), 5) 
        : null;
      return {
          isEligible,
          unlockTime
      };
  }, [user, qualifyingReferralsCount]);
  
  const updateTimer = useCallback(() => {
    if (eligibilityCheck.isEligible && eligibilityCheck.unlockTime) {
      const now = new Date();
      if (isAfter(now, eligibilityCheck.unlockTime)) {
        setCanWithdraw(true);
        setTimeLeft("");
        return true; // Timer finished
      } else {
        setCanWithdraw(false);
        const diffSeconds = differenceInSeconds(eligibilityCheck.unlockTime, now);
        if (diffSeconds >= 0) {
            const minutes = Math.floor(diffSeconds / 60);
            const seconds = diffSeconds % 60;
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    } else {
      setCanWithdraw(false);
      setTimeLeft("");
    }
    return false; // Timer not finished
  }, [eligibilityCheck]);

  useEffect(() => {
    const finished = updateTimer();
    if (finished) return;

    const interval = setInterval(() => {
      if (updateTimer()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [updateTimer]);

  if (!user) return null;
  
  const withdrawalLimit = user.wallet.balance * 0.02;
  const transactions = getTransactions();

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({
      title: t('toast.copied.title'),
      description: t('toast.copied.descriptionWallet'),
    });
  }
  
  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setDepositProof(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDepositProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setDepositProofPreview("");
    }
  };

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: t('toast.invalidAmount.title'),
        description: t('toast.invalidAmount.description'),
      });
      return;
    }
    
    if (!depositProof || !depositProofPreview) {
        toast({
            variant: "destructive",
            title: t('toast.proofRequired.title'),
            description: t('toast.proofRequired.description'),
        });
        return;
    }

    deposit({ amount, proof: depositProofPreview });

    toast({
      title: t('toast.depositSubmitted.title'),
      description: t('toast.depositSubmitted.description', { amount: amount.toFixed(2) }),
    });
    setDepositAmount("");
    setDepositProof(null);
    setDepositProofPreview("");
    const fileInput = document.getElementById('proof') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || !withdrawAddress) {
      toast({
        variant: "destructive",
        title: t('toast.invalidInput.title'),
        description: t('toast.invalidInput.description'),
      });
      return;
    }

    const success = withdraw({ amount, address: withdrawAddress });

    if (success) {
      toast({
        title: t('toast.withdrawalSubmitted.title'),
        description: t('toast.withdrawalSubmitted.description'),
      });
      setWithdrawAmount("");
      setWithdrawAddress("");
    } else {
      toast({
        variant: "destructive",
        title: t('toast.withdrawalFailed.title'),
        description: t('toast.withdrawalFailed.description'),
      });
    }
  }


  return (
    <div className="container mx-auto">
      <div className="space-y-4 mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">{t('wallet.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('wallet.description')}</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('wallet.balance.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold text-primary">${user.wallet.balance.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{t('wallet.balance.bonusInfo')}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="deposit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deposit">{t('wallet.tabs.deposit')}</TabsTrigger>
          <TabsTrigger value="withdraw">{t('wallet.tabs.withdraw')}</TabsTrigger>
        </TabsList>
        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle>Deposit USDT</CardTitle>
              <CardDescription>Copy the wallet address to deposit and choose the TRC20 network.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Image src="https://storage.googleapis.com/maker-studio-5f2c4.appspot.com/user-assets%2F1805166300431448-4395%2Foutput.png" alt="QR Code" width={200} height={200} />
                <div className="w-full space-y-2">
                  <Label htmlFor="wallet-address">TRC20 network wallet address for USDT deposit</Label>
                  <div className="flex items-center gap-2">
                    <Input id="wallet-address" readOnly value={walletAddress} className="font-mono" />
                    <Button variant="outline" size="icon" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">{t('wallet.deposit.amountLabel')}</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder={t('wallet.deposit.amountPlaceholder')}
                  value={depositAmount} 
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
              {depositAmount && parseFloat(depositAmount) > 0 && (
                  <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>{t('wallet.deposit.fee.title')}</AlertTitle>
                      <AlertDescription>
                          {t('wallet.deposit.fee.description', { fee: ((parseFloat(depositAmount) || 0) * 0.01).toFixed(2), received: ((parseFloat(depositAmount) || 0) * 0.99).toFixed(2) })}
                      </AlertDescription>
                  </Alert>
              )}
               <div className="space-y-2">
                  <Label htmlFor="proof">{t('wallet.deposit.proofLabel')}</Label>
                  <Input 
                      id="proof" 
                      type="file"
                      accept="image/*"
                      onChange={handleProofChange}
                      className="file:text-foreground"
                  />
                  {depositProofPreview && <Image src={depositProofPreview} alt="Proof preview" width={200} height={100} className="mt-4 rounded-md object-cover" />}
              </div>
              <Button className="w-full" onClick={handleDeposit}>{t('wallet.deposit.submitButton')}</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>{t('wallet.withdraw.title')}</CardTitle>
              <CardDescription>{t('wallet.withdraw.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('wallet.withdraw.conditions.title')}</AlertTitle>
                <AlertDescription>
                   {t('wallet.withdraw.conditions.description', { referralsCount: qualifyingReferralsCount })}
                  {eligibilityCheck.isEligible && !canWithdraw && timeLeft && (
                    <span className="font-bold block mt-2">{t('wallet.withdraw.conditions.unlockTimer', { timeLeft: timeLeft })}</span>
                  )}
                </AlertDescription>
              </Alert>
               <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('wallet.withdraw.fee.title')}</AlertTitle>
                <AlertDescription>{t('wallet.withdraw.fee.description')}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="withdraw-address">{t('wallet.withdraw.addressLabel')}</Label>
                <Input 
                  id="withdraw-address" 
                  placeholder={t('wallet.withdraw.addressPlaceholder')}
                  disabled={!canWithdraw} 
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">{t('wallet.withdraw.amountLabel')}</Label>
                <Input 
                  id="withdraw-amount" 
                  type="number" 
                  placeholder={t('wallet.withdraw.amountPlaceholder', { limit: (user.wallet.balance / 1.03).toFixed(2) })}
                  disabled={!canWithdraw} 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <Button className="w-full" onClick={handleWithdraw} disabled={!canWithdraw}>{t('wallet.withdraw.submitButton')}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('wallet.history.title')}</CardTitle>
          <CardDescription>{t('wallet.history.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('wallet.history.table.date')}</TableHead>
                <TableHead>{t('wallet.history.table.type')}</TableHead>
                <TableHead>{t('wallet.history.table.amount')}</TableHead>
                <TableHead className="text-right">{t('wallet.history.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(new Date(tx.date), "PPp")}</TableCell>
                    <TableCell className="capitalize">{t(`wallet.history.types.${tx.type}`)}</TableCell>
                    <TableCell className={`font-mono ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={tx.status === 'Approved' ? 'default' : tx.status === 'Pending' ? 'secondary' : 'destructive'}>
                        {t(`wallet.history.statuses.${tx.status}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {t('wallet.history.noTransactions')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

    
    
    
