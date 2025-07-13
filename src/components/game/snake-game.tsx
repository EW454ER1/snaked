
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react"
import { useUser } from "@/context/user-context"
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"


const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 460;
const INITIAL_SPEED = 150; // Milliseconds between updates
const MIN_SPEED = 40; // Fastest speed
const SPEED_DECREMENT = 2; // How much speed increases per food
const FOOD_TELEPORT_INTERVAL = 2000; // How often the food teleports (in ms)

const getRandomCoordinates = () => {
  return {
    x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
    y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
  };
}

const initialSnake = [{ x: 20, y: 11 }]; // Start in the middle

// Obstacle Levels
const level1Obstacles = [
  // Top-left L-shape
  { x: 4, y: 4 }, { x: 5, y: 4 }, { x: 6, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 },
  // Bottom-right L-shape
  { x: 35, y: 18 }, { x: 34, y: 18 }, { x: 33, y: 18 }, { x: 35, y: 17 }, { x: 35, y: 16 },
];

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Helper to find a valid position for food
const getNewFoodPosition = (snake: {x:number, y:number}[], obstacles: {x:number, y:number}[]) => {
    let newFoodPosition;
    let validPosition = false;
    while (!validPosition) {
        newFoodPosition = getRandomCoordinates();
        const onSnake = snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y);
        const onObstacle = obstacles.some(obs => obs.x === newFoodPosition.x && obs.y === newFoodPosition.y);
        validPosition = !onSnake && !onObstacle;
    }
    return newFoodPosition;
};

const generateRandomFoodValue = (min: number, max: number) => {
    const randomValue = Math.random() * (max - min) + min;
    return parseFloat(randomValue.toFixed(2));
}

const generateDynamicObstacles = (snake: {x:number, y:number}[], food: {x:number, y:number}, existingObstacles: {x:number, y:number}[]) => {
    const newObstacles: {x: number, y: number}[] = [];
    const obstacleCount = 10;

    while(newObstacles.length < obstacleCount) {
        let position = getRandomCoordinates();

        const onSnake = snake.some(segment => segment.x === position.x && segment.y === position.y);
        const onFood = food.x === position.x && food.y === position.y;
        const onExistingObstacle = existingObstacles.some(obs => obs.x === position.x && obs.y === position.y);
        const onNewObstacle = newObstacles.some(obs => obs.x === position.x && obs.y === position.y);

        if (!onSnake && !onFood && !onExistingObstacle && !onNewObstacle) {
            newObstacles.push(position);
        }
    }
    return newObstacles;
};


interface SnakeGameProps {
  betAmount: number;
  minFoodValue: number;
  maxFoodValue: number;
}

export function SnakeGame({ betAmount, minFoodValue, maxFoodValue }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameOverInProgress = useRef(false);
  const router = useRouter();
  const { earn, inventory, useRevive, useObstacleShield, spend, wallet, recordGameResult } = useUser();
  const { toast } = useToast();
  
  // Game states
  const [snake, setSnake] = useState(initialSnake);
  const [obstacles, setObstacles] = useState(level1Obstacles);
  const [food, setFood] = useState(() => getNewFoodPosition(initialSnake, level1Obstacles));
  const [foodValue, setFoodValue] = useState(() => generateRandomFoodValue(minFoodValue, maxFoodValue));
  const [direction, setDirection] = useState<Direction | null>(null);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [hasBeenPaused, setHasBeenPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0.00);
  const [countdown, setCountdown] = useState(5);
  const [dynamicObstaclesSpawned, setDynamicObstaclesSpawned] = useState(false);
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [isFoodTeleporting, setIsFoodTeleporting] = useState(false);

  // This effect runs once when the component mounts to set up the game
  useEffect(() => {
    if (inventory.obstacleShieldCount > 0) {
      if (useObstacleShield()) {
        setIsShieldActive(true);
        setObstacles([]); // Clear all obstacles
        toast({
          title: "Obstacle Shield Active!",
          description: "No obstacles will spawn this round.",
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures it runs only once

  const generateNewFood = useCallback((currentSnake: {x:number, y:number}[], currentObstacles: {x:number, y:number}[]) => {
    setFood(getNewFoodPosition(currentSnake, currentObstacles));
    setFoodValue(generateRandomFoodValue(minFoodValue, maxFoodValue));
  }, [minFoodValue, maxFoodValue]);
  
  const resetGame = useCallback(() => {
    gameOverInProgress.current = false;
    const shieldWillBeActive = inventory.obstacleShieldCount > 0;
    if (shieldWillBeActive) {
      if(useObstacleShield()) {
         toast({
            title: "Obstacle Shield Active!",
            description: "No obstacles will spawn this round.",
        });
      }
    }
    const initialObstacles = shieldWillBeActive ? [] : level1Obstacles;
    
    setIsShieldActive(shieldWillBeActive);
    setObstacles(initialObstacles);
    setSnake(initialSnake);
    generateNewFood(initialSnake, initialObstacles);
    setDirection(null);
    setIsGameOver(false);
    setScore(0.00);
    setSpeed(INITIAL_SPEED);
    setIsPaused(false);
    setHasBeenPaused(false);
    setCountdown(5);
    setGameStarted(false);
    setDynamicObstaclesSpawned(false);
    setIsFoodTeleporting(false);
    gameOverInProgress.current = false;

  }, [generateNewFood, useObstacleShield, toast, inventory.obstacleShieldCount]);

  const triggerGameOver = useCallback(() => {
    if (gameOverInProgress.current) return;
    gameOverInProgress.current = true;
    
    const reviveResult = useRevive();

    if (reviveResult.success) {
      toast({
        title: "Second Chance!",
        description: `You have been revived! You have ${reviveResult.remaining} revives left.`,
      });
      setSnake(initialSnake);
      setDirection('RIGHT');
      gameOverInProgress.current = false; // Allow another death later
    } else {
      setIsGameOver(true);
    }
  }, [useRevive, toast]);

  // Effect to handle actions when game is over
  useEffect(() => {
    if (isGameOver) {
      const didWin = score > betAmount;
      recordGameResult(didWin);

      if (score > 0) {
        earn(score);
        toast({
          title: "Winnings Added!",
          description: `You earned $${score.toFixed(2)}! It has been added to your wallet.`
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver]);

  // Countdown timer
  useEffect(() => {
    if (!gameStarted && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && !gameStarted) {
      setGameStarted(true)
      setDirection('RIGHT'); // Start moving right automatically
    }
  }, [countdown, gameStarted])

  const changeDirection = useCallback((newDirection: Direction) => {
    setDirection((prevDirection) => {
      // This logic prevents the snake from reversing on itself
      if (newDirection === 'UP' && prevDirection !== 'DOWN') return 'UP';
      if (newDirection === 'DOWN' && prevDirection !== 'UP') return 'DOWN';
      if (newDirection === 'LEFT' && prevDirection !== 'RIGHT') return 'LEFT';
      if (newDirection === 'RIGHT' && prevDirection !== 'LEFT') return 'RIGHT';
      return prevDirection; // Keep old direction if move is invalid
    });
  }, []);


  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!gameStarted) return;
    switch (e.key) {
      case "ArrowUp":
        changeDirection('UP');
        break;
      case "ArrowDown":
        changeDirection('DOWN');
        break;
      case "ArrowLeft":
        changeDirection('LEFT');
        break;
      case "ArrowRight":
        changeDirection('RIGHT');
        break;
    }
  }, [gameStarted, changeDirection]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown]);

  // Game Loop
  useEffect(() => {
    if (!gameStarted || isPaused || isGameOver || !direction) {
      return;
    }
  
    const gameInterval = setInterval(() => {
      let newSnake = [...snake];
      const head = { ...newSnake[0] };
  
      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // --- Collision Detection ---
      const isWallCollision = head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE || head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE;
      const isSelfCollision = newSnake.slice(1).some(segment => head.x === segment.x && head.y === segment.y);
      const isObstacleCollision = obstacles.some(obstacle => head.x === obstacle.x && head.y === obstacle.y);
  
      if (isWallCollision || isSelfCollision || isObstacleCollision) {
        triggerGameOver();
        return; // Stop this tick
      }
  
      // --- No Collision: Update game state ---
      newSnake.unshift(head);
  
      if (head.x === food.x && head.y === food.y) {
        let nextObstacles = obstacles;
        const newScore = parseFloat((score + foodValue).toFixed(2));
        
        if (betAmount > 0 && newScore >= (betAmount / 2) && !dynamicObstaclesSpawned && !isShieldActive) {
          const dynamicObs = generateDynamicObstacles(newSnake, food, obstacles);
          nextObstacles = [...nextObstacles, ...dynamicObs];
          setDynamicObstaclesSpawned(true);
          toast({ title: "Watch Out!", description: "The field has become more dangerous!" });
        }
        
        // NEW: Check for teleporting food condition
        if(newScore >= 20 && !isFoodTeleporting) {
          setIsFoodTeleporting(true);
          toast({ title: "Challenge!", description: "The food is now teleporting!" });
        }

        setObstacles(nextObstacles);
        setScore(newScore);
        setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_DECREMENT));
        generateNewFood(newSnake, nextObstacles);
      } else {
        newSnake.pop();
      }
      
      setSnake(newSnake);
    }, speed);
  
    return () => clearInterval(gameInterval);
  }, [gameStarted, isPaused, isGameOver, direction, speed, snake, food, foodValue, obstacles, generateNewFood, triggerGameOver, score, betAmount, dynamicObstaclesSpawned, toast, isShieldActive, isFoodTeleporting]);

  // Food Teleporting Loop
  useEffect(() => {
    if (!isFoodTeleporting || isPaused || isGameOver) {
      return;
    }

    const teleportInterval = setInterval(() => {
      generateNewFood(snake, obstacles);
    }, FOOD_TELEPORT_INTERVAL);

    return () => clearInterval(teleportInterval);
  }, [isFoodTeleporting, isPaused, isGameOver, snake, obstacles, generateNewFood]);
  
  // Drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Clear canvas with a darker background for better contrast
    context.fillStyle = "#0f172a"; // Dark Slate
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw snake with a vibrant green color
    context.fillStyle = "#4ade80"; // Vibrant Green
    snake.forEach(segment => {
      context.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    });
    
    // Draw food with a bright red color
    context.fillStyle = isFoodTeleporting ? "#facc15" : "#f87171"; // Yellow when teleporting, else Red
    context.beginPath();
    context.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2, 
      food.y * GRID_SIZE + GRID_SIZE / 2, 
      GRID_SIZE / 2 - 1, 
      0, 
      2 * Math.PI
    );
    context.fill();

    // Draw obstacles with a neutral grey color
    context.fillStyle = "#64748b"; // Slate Grey
    obstacles.forEach(obs => {
      context.fillRect(obs.x * GRID_SIZE, obs.y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
    });

  }, [snake, food, obstacles, gameStarted, isFoodTeleporting]);

  const handlePause = () => {
    if (!isGameOver) {
      if (isPaused) {
        setIsPaused(false);
        return;
      }
      if (!hasBeenPaused) {
        setIsPaused(true);
        setHasBeenPaused(true);
      }
    }
  }

  const netWin = score - betAmount;

  return (
    <div className="relative w-full h-full bg-black">
      {!gameStarted ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <p className="text-lg text-white mb-2">Game starts in</p>
          <h1 className="text-8xl font-bold text-white font-mono tabular-nums">
            {countdown}
          </h1>
        </div>
      ) : (
        <div className="absolute top-2 left-2 z-10 bg-black/50 p-2 rounded-lg text-white font-mono text-sm space-y-1">
          <p>Score: ${score.toFixed(2)}</p>
          <p className="text-green-400">Next Food: +${foodValue.toFixed(2)}</p>
          <div className="flex items-center gap-2">
            <p className="text-accent">Revives: {inventory.reviveCount}</p>
          </div>
           <div className="flex items-center gap-2">
            <p className="text-accent">Shields: {inventory.obstacleShieldCount}</p>
             {isShieldActive && <ShieldCheck className="h-4 w-4 text-accent animate-pulse" />}
          </div>
        </div>
      )}
      
      {isGameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <CardTitle className="text-3xl font-headline text-center">Game Over</CardTitle>
              <CardDescription className="text-center">Here are your game results.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Final Score:</span>
                <span className="font-bold">${score.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Bet Amount:</span>
                <span className="font-bold">${betAmount.toFixed(2)}</span>
              </div>
              <hr className="border-border" />
              <div className="flex justify-between items-center text-xl">
                <span className="text-muted-foreground">Net Win/Loss:</span>
                <span className={cn(
                  "font-bold font-mono",
                  netWin >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {netWin >= 0 ? `+$${netWin.toFixed(2)}` : `-$${Math.abs(netWin).toFixed(2)}`}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-4">
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" variant="secondary" disabled={betAmount > 0 && wallet.balance < betAmount}>
                    {betAmount > 0 && wallet.balance < betAmount ? "Insufficient Funds" : "Play Again"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Play Again?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {betAmount > 0
                        ? `A bet of $${betAmount} will be deducted to play again.`
                        : "Ready for another round?"}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      if (betAmount > 0) {
                        if (!spend(betAmount)) {
                          toast({
                            variant: "destructive",
                            title: "Insufficient Funds",
                            description: "You cannot afford to play this table again."
                          });
                          router.push('/lobby');
                          return;
                        }
                      }
                      resetGame();
                    }}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={() => router.push('/lobby')} className="w-full" variant="outline">Exit to Lobby</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <canvas ref={canvasRef} className="w-full h-full" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
       
       {gameStarted && (
        <>
          <div className="absolute top-2 right-2 z-10">
            <Button onClick={handlePause} variant="secondary" disabled={isGameOver || (!isPaused && hasBeenPaused)}>
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
          {/* On-screen controls for mobile */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 grid grid-cols-3 gap-2 w-32 md:hidden">
              <div /> {/* Top-left empty */}
              <Button size="sm" variant="ghost" onClick={() => changeDirection('UP')} className="col-start-2 bg-black/20 text-white/80 hover:bg-black/40">
                  <ArrowUp />
              </Button>
              <div /> {/* Top-right empty */}
          
              <Button size="sm" variant="ghost" onClick={() => changeDirection('LEFT')} className="bg-black/20 text-white/80 hover:bg-black/40">
                  <ArrowLeft />
              </Button>
              <div /> {/* Middle empty */}
              <Button size="sm" variant="ghost" onClick={() => changeDirection('RIGHT')} className="bg-black/20 text-white/80 hover:bg-black/40">
                  <ArrowRight />
              </Button>
          
              <div /> {/* Bottom-left empty */}
              <Button size="sm" variant="ghost" onClick={() => changeDirection('DOWN')} className="col-start-2 bg-black/20 text-white/80 hover:bg-black/40">
                  <ArrowDown />
              </Button>
              <div /> {/* Bottom-right empty */}
          </div>
        </>
       )}
    </div>
  )
}
