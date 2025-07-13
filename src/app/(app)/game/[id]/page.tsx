import { SnakeGame } from "@/components/game/snake-game"
import { Card, CardContent } from "@/components/ui/card"
import { gameTables } from "@/lib/game-data"

export default function GamePage({ params }: { params: { id: string } }) {
  const tableId = params.id
  const table = gameTables.find(t => t.id === parseInt(tableId))

  const betAmount = table ? table.bet : 0
  const minFoodValue = table ? table.minFoodValue : 0.06
  const maxFoodValue = table ? table.maxFoodValue : 0.10

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h1 className="text-3xl font-headline">Table {tableId}</h1>
        <p className="text-muted-foreground">Bet Amount: ${betAmount}</p>
      </div>
      <Card className="w-full max-w-6xl aspect-video overflow-hidden shadow-2xl">
        <CardContent className="p-0">
          <SnakeGame betAmount={betAmount} minFoodValue={minFoodValue} maxFoodValue={maxFoodValue} />
        </CardContent>
      </Card>
    </div>
  )
}
