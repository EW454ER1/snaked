"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Transaction {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  status: string;
  created_at?: string;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:8000/transactions")
      .then(res => res.json())
      .then(data => {
        setTransactions(data)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not fetch transactions from backend API.")
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User ID</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b">
                    <td>{tx.id}</td>
                    <td>{tx.user_id}</td>
                    <td>{tx.type}</td>
                    <td>{tx.amount}</td>
                    <td>{tx.status}</td>
                    <td>{tx.created_at ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
