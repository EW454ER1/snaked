
"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  CheckCircle,
  XCircle,
  LogOut,
  UserX,
  UserCheck,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import { useUser, type Deposit, type User } from "@/context/user-context"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast();
  const { 
      getAllUsers, 
      getAllDeposits, 
      getAllWithdrawals,
      updateUserStatus,
      approveTransaction,
      rejectTransaction,
      isInitialized,
  } = useUser()
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [viewingProofDetails, setViewingProofDetails] = useState<{user: string, amount: string} | null>(null);

  if (!isInitialized) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <Skeleton className="h-12 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-10 w-full mb-2" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const users = getAllUsers();
  const deposits = getAllDeposits();
  const withdrawals = getAllWithdrawals();

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("isAdmin")
      router.push("/admin/login")
    } catch(e) {
      console.error("Could not log out:", e)
    }
  }

  const handleToggleSuspend = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    updateUserStatus(userId, newStatus);
    toast({ title: `User ${newStatus}` });
  };

  const handleTransaction = (id: string, type: 'deposit' | 'withdrawal', action: 'approve' | 'reject') => {
    if (action === 'approve') {
        approveTransaction(id, type);
        toast({ title: "Transaction Approved", description: `The ${type} has been processed.` });
    } else {
        rejectTransaction(id, type);
        toast({ title: "Transaction Rejected", variant: "destructive" });
    }
  }
  
  const handleViewProof = (deposit: Deposit & { user?: User | undefined }) => {
    setViewingProof(deposit.proof);
    setViewingProofDetails({
      user: deposit.user?.profile.name || 'N/A',
      amount: deposit.amount.toFixed(2)
    });
  }

  const topReferrers = [...users]
    .filter(u => u.referrals.length > 0)
    .map(u => ({
        ...u,
        totalReferred: u.referrals.length,
        totalEarnings: u.referrals.reduce((sum, r) => sum + r.earnings, 0)
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 10);

  const pendingDeposits = deposits.filter(d => d.status === 'Pending');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');
  const pendingTransactionsCount = pendingDeposits.length + pendingWithdrawals.length;
  const totalRevenue = deposits.filter(d => d.status === 'Approved').reduce((acc, d) => acc + (d.amount * 0.02), 0);

  return (
    <>
      <Dialog open={!!viewingProof} onOpenChange={(open) => {
        if (!open) {
          setViewingProof(null);
          setViewingProofDetails(null);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Proof of Transfer</DialogTitle>
            {viewingProofDetails && (
              <DialogDescription>
                User: {viewingProofDetails.user} - Amount: ${viewingProofDetails.amount}
              </DialogDescription>
            )}
          </DialogHeader>
          {viewingProof && (
            <div className="mt-4">
              <Image src={viewingProof} alt="Proof of transfer" width={800} height={600} className="w-full h-auto max-h-[70vh] object-contain rounded-md" />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter">Admin Panel</h1>
            <p className="text-muted-foreground text-lg">Centralized control for site management.</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions
              {pendingTransactionsCount > 0 && <Badge className="ml-2 bg-primary/20 text-primary">{pendingTransactionsCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{users.length}</div>
                          <p className="text-xs text-muted-foreground">All registered users</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total Revenue (2% Fee)</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                          <p className="text-xs text-muted-foreground">From approved deposits</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending Deposits</CardTitle>
                          <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{pendingDeposits.length}</div>
                          <p className="text-xs text-muted-foreground">Awaiting approval</p>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
                          <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                          <div className="text-2xl font-bold">{pendingWithdrawals.length}</div>
                          <p className="text-xs text-muted-foreground">Awaiting approval</p>
                      </CardContent>
                  </Card>
              </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View, edit, or suspend user accounts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono">{user.id}</TableCell>
                        <TableCell>{user.profile.name}</TableCell>
                        <TableCell>{user.profile.email}</TableCell>
                        <TableCell className="font-mono">${user.wallet.balance.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'Active' ? 'default' : 'destructive'}>{user.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.status === 'Active' ? (
                              <Button variant="destructive" size="sm" onClick={() => handleToggleSuspend(user.id)}>
                                  <UserX className="mr-2 h-4 w-4" /> Suspend
                              </Button>
                          ) : (
                              <Button variant="secondary" size="sm" onClick={() => handleToggleSuspend(user.id)}>
                                  <UserCheck className="mr-2 h-4 w-4" /> Unsuspend
                              </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">No users found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
              <Tabs defaultValue="deposits" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="deposits">
                          Deposits
                          {pendingDeposits.length > 0 && <Badge className="ml-2">{pendingDeposits.length}</Badge>}
                      </TabsTrigger>
                      <TabsTrigger value="withdrawals">
                          Withdrawals
                          {pendingWithdrawals.length > 0 && <Badge className="ml-2">{pendingWithdrawals.length}</Badge>}
                      </TabsTrigger>
                  </TabsList>
                  <TabsContent value="deposits">
                      <Card>
                          <CardHeader><CardTitle>Pending Deposits</CardTitle></CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Proof</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                      {pendingDeposits.length > 0 ? pendingDeposits.map(d => (
                                          <TableRow key={d.id}>
                                              <TableCell className="font-mono text-xs">{d.id}</TableCell>
                                              <TableCell>{d.user?.profile.name || 'N/A'}</TableCell>
                                              <TableCell>${d.amount.toFixed(2)}</TableCell>
                                              <TableCell>{format(new Date(d.date), "PPp")}</TableCell>
                                              <TableCell>
                                                <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => handleViewProof(d)}>
                                                  View
                                                </Button>
                                              </TableCell>
                                              <TableCell className="text-right space-x-2">
                                                  <Button size="sm" variant="outline" className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-400" onClick={() => handleTransaction(d.id, 'deposit', 'approve')}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                                                  <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleTransaction(d.id, 'deposit', 'reject')}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                              </TableCell>
                                          </TableRow>
                                      )) : (
                                          <TableRow>
                                              <TableCell colSpan={6} className="h-24 text-center">No pending deposits.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                  </TabsContent>
                  <TabsContent value="withdrawals">
                      <Card>
                          <CardHeader><CardTitle>Pending Withdrawals</CardTitle></CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Address</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                      {pendingWithdrawals.length > 0 ? pendingWithdrawals.map(w => (
                                          <TableRow key={w.id}>
                                              <TableCell className="font-mono text-xs">{w.id}</TableCell>
                                              <TableCell>{w.user?.profile.name || 'N/A'}</TableCell>
                                              <TableCell>${w.amount.toFixed(2)}</TableCell>
                                              <TableCell className="font-mono text-xs">{w.address}</TableCell>
                                              <TableCell>{format(new Date(w.date), "PPp")}</TableCell>
                                              <TableCell className="text-right space-x-2">
                                                  <Button size="sm" variant="outline" className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-400" onClick={() => handleTransaction(w.id, 'withdrawal', 'approve')}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                                                  <Button size="sm" variant="outline" className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={() => handleTransaction(w.id, 'withdrawal', 'reject')}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                                              </TableCell>
                                          </TableRow>
                                      )) : (
                                          <TableRow>
                                              <TableCell colSpan={6} className="h-24 text-center">No pending withdrawals.</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>
          </TabsContent>

          <TabsContent value="referrals">
              <Card>
                  <CardHeader><CardTitle>Referral System Status</CardTitle><CardDescription>Top referrers by earnings.</CardDescription></CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Referral Code</TableHead><TableHead>Total Referred</TableHead><TableHead className="text-right">Total Earnings</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {topReferrers.length > 0 ? topReferrers.map(user => (
                              <TableRow key={user.id}>
                                  <TableCell>{user.profile.name}</TableCell>
                                  <TableCell className="font-mono">{user.profile.referralCode}</TableCell>
                                  <TableCell>{user.totalReferred}</TableCell>
                                  <TableCell className="text-right font-mono">${user.totalEarnings.toFixed(2)}</TableCell>
                              </TableRow>
                            )) : (
                                  <TableRow>
                                      <TableCell colSpan={4} className="h-24 text-center">No referral data available.</TableCell>
                                  </TableRow>
                            )}
                          </TableBody>
                      </Table>
                  </CardContent>
              </Card>
          </TabsContent>

        </Tabs>
      </div>
    </>
  )
}
