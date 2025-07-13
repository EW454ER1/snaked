export interface GameTable {
  id: number;
  name: string;
  bet: number;
  required: string;
  minFoodValue: number;
  maxFoodValue: number;
}

export const gameTables: GameTable[] = [
  { id: 1, name: "Training Ground", bet: 0, required: "Free (1/day)", minFoodValue: 0.0004, maxFoodValue: 0.0008 },
  { id: 2, name: "Bronze League", bet: 10, required: "$10 Bet", minFoodValue: 0.06, maxFoodValue: 0.10 },
  { id: 3, name: "Silver League", bet: 50, required: "$50 Bet", minFoodValue: 0.10, maxFoodValue: 0.50 },
  { id: 4, name: "Gold League", bet: 100, required: "$100 Bet", minFoodValue: 0.30, maxFoodValue: 1.00 },
  { id: 5, name: "Platinum Arena", bet: 250, required: "$250 Bet", minFoodValue: 0.33, maxFoodValue: 1.00 },
  { id: 6, name: "Diamond Arena", bet: 500, required: "$500 Bet", minFoodValue: 1.00, maxFoodValue: 2.50 },
  { id: 7, name: "Master's Challenge", bet: 1000, required: "$1000 Bet", minFoodValue: 5.00, maxFoodValue: 15.00 },
];
