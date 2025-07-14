"use client"

import React, { useEffect, useState } from "react"
// Use environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface User {
  id: number;
  username: string;
  email: string;
  is_blocked: boolean;
  is_first_login?: boolean;
  balance?: number;
}

interface TopPlayer {
  username: string;
  balance: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchTopPlayers()
  }, [])


  function fetchUsers() {
    setLoading(true)
    fetch(`${API_URL}/users`)
      .then(res => res.json())
      .then(data => {
        setUsers(data)
        setLoading(false)
      })
      .catch(() => {
        setError("Could not fetch users from backend API.")
        setLoading(false)
      })
  }

  function fetchTopPlayers() {
    fetch(`${API_URL}/top-players`)
      .then(res => res.json())
      .then(data => setTopPlayers(data))
      .catch(() => setTopPlayers([]))
  }

  function handleBlockToggle(user: User) {
    setActionLoading(user.id)
    fetch(`${API_URL}/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, is_blocked: !user.is_blocked })
    })
      .then(res => res.json())
      .then(() => {
        fetchUsers()
        setActionLoading(null)
      })
      .catch(() => setActionLoading(null))
  }

  function handleDelete(user: User) {
    if (!window.confirm(`Are you sure you want to delete user ${user.username}?`)) return;
    setActionLoading(user.id)
    fetch(`${API_URL}/users/${user.id}`, { method: "DELETE" })
      .then(() => {
        fetchUsers()
        setActionLoading(null)
      })
      .catch(() => setActionLoading(null))
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div>Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && (
              <table className="w-full text-sm border rounded overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Blocked</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                      <td>{user.id}</td>
                      <td className="font-semibold">{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={user.is_blocked ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                          {user.is_blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td>{user.balance ?? "-"}</td>
                      <td className="flex gap-2">
                        <Button
                          size="sm"
                          variant={user.is_blocked ? "secondary" : "destructive"}
                          disabled={actionLoading === user.id}
                          onClick={() => handleBlockToggle(user)}
                        >
                          {user.is_blocked ? "Unblock" : "Block"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === user.id}
                          onClick={() => handleDelete(user)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-900 dark:to-yellow-700 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">🏆 Top Players</CardTitle>
          </CardHeader>
          <CardContent>
            {topPlayers.length === 0 && <div>No data yet.</div>}
            <ul className="space-y-2">
              {topPlayers.map((player, idx) => (
                <li key={player.username} className="flex items-center gap-2">
                  <span className="font-bold text-lg text-yellow-700 dark:text-yellow-100">#{idx + 1}</span>
                  <span className="flex-1 font-semibold">{player.username}</span>
                  <span className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded text-xs font-mono">${player.balance.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}