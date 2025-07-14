"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface Referral {
  id: number;
  user_id: number;
  code: string;
  referred_by?: number;
  bonus?: number;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("http://localhost:8000/referrals")
      .then(res => res.json())
      .then(data => {
        setReferrals(data)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not fetch referrals from backend API.")
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Referrals</CardTitle>
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
                  <th>Code</th>
                  <th>Referred By</th>
                  <th>Bonus</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(ref => (
                  <tr key={ref.id} className="border-b">
                    <td>{ref.id}</td>
                    <td>{ref.user_id}</td>
                    <td>{ref.code}</td>
                    <td>{ref.referred_by ?? '-'}</td>
                    <td>{ref.bonus ?? '-'}</td>
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
