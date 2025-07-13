
"use client"

import { useMemo, useState, useEffect } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { useUser } from "@/context/user-context"
import { useTranslation } from "react-i18next"

const chartConfig = {
  referrals: {
    label: "Referrals",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function ReferralsPage() {
    const { t } = useTranslation();
    const { toast } = useToast()
    const { user, referrals, getReferralStats } = useUser()
    const [userReferralLink, setUserReferralLink] = useState("")

    useEffect(() => {
        if (user && typeof window !== "undefined") {
            setUserReferralLink(`${window.location.origin}/sign-up?ref=${user.profile.referralCode}`);
        }
    }, [user]);

    const userReferralStats = getReferralStats()

    const chartData = useMemo(() => {
        const monthlyData: { [key: string]: { month: string, referrals: number } } = {};
        
        referrals.forEach(referral => {
            const month = format(parseISO(referral.date), "MMMM");
            if (!monthlyData[month]) {
                monthlyData[month] = { month, referrals: 0 };
            }
            monthlyData[month].referrals++;
        });

        const allMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonthIndex = new Date().getMonth();
        
        const sortedData = allMonths
          .slice(0, currentMonthIndex + 1)
          .map(month => monthlyData[month] || { month, referrals: 0 });

        return sortedData;

    }, [referrals])
    
    if (!user) {
        return null; // or a loading skeleton
    }

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: t('toast.copied.title'),
            description: t('toast.copied.descriptionReferral'),
        });
    }

  return (
    <div className="container mx-auto">
      <div className="space-y-4 mb-8">
        <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">{t('referrals.title')}</h1>
        <p className="text-muted-foreground text-lg">{t('referrals.description')}</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('referrals.stats.total')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{userReferralStats.totalReferrals}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('referrals.stats.active')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{userReferralStats.activeReferrals}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{t('referrals.stats.earnings')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">${userReferralStats.totalEarnings.toFixed(2)}</p>
            </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('referrals.yourInfo.title')}</CardTitle>
          <CardDescription>{t('referrals.yourInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ref-code">{t('referrals.yourInfo.codeLabel')}</Label>
            <div className="flex items-center gap-2">
              <Input id="ref-code" readOnly value={user.profile.referralCode} className="font-mono text-lg" />
              <Button variant="outline" size="icon" onClick={() => handleCopy(user.profile.referralCode)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="ref-link">{t('referrals.yourInfo.linkLabel')}</Label>
            <div className="flex items-center gap-2">
              <Input id="ref-link" readOnly value={userReferralLink} placeholder={t('referrals.yourInfo.linkPlaceholder')} className="font-mono" />
              <Button variant="outline" size="icon" onClick={() => handleCopy(userReferralLink)} disabled={!userReferralLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
            <CardTitle>{t('referrals.growth.title')}</CardTitle>
            <CardDescription>{t('referrals.growth.description')}</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
                <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => t(`months.${value.toLowerCase()}`)}
                    />
                    <YAxis allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="referrals" fill="var(--color-referrals)" radius={4} />
                </BarChart>
            </ChartContainer>
        </CardContent>
    </Card>

    <Card className="mb-8">
        <CardHeader>
            <CardTitle>{t('referrals.list.title')}</CardTitle>
            <CardDescription>{t('referrals.list.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('referrals.list.table.username')}</TableHead>
                <TableHead>{t('referrals.list.table.dateJoined')}</TableHead>
                <TableHead>{t('referrals.list.table.status')}</TableHead>
                <TableHead className="text-right">{t('referrals.list.table.earnings')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length > 0 ? (
                referrals.map((referral) => (
                  <TableRow key={referral.username}>
                    <TableCell className="font-medium">{referral.username}</TableCell>
                    <TableCell>{format(parseISO(referral.date), 'PP')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          referral.status === "Active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {t(`referrals.list.statuses.${referral.status.toLowerCase()}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${referral.earnings.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {t('referrals.list.noReferrals')}
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
