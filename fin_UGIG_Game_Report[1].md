## 1. Introduction

This document provides an overview of the UGIG Guessing Game, including its features, layouts, and database design. The game allows multi players to take turns guessing a secret number or block or cell, with the winner being the one who guesses correctly first.

---

## 2. Features

- multi Players: The game is designed for multi players, with each player taking turns guessing.
- Correct Attempt Counter: Each player’s correct number of attempts is tracked when its 3 , opposite player's turn gets cancelled ( This is not required in MVP)
- Turn Timer: Each player has a limited time to make a guess.
- Game End Logic: Either the tiles run out or a player disconnects..
- Disconnect alert : when a person is in the middle of a game and tries to disconnec the browser throws an error
- Secure Data : using Jwt and bcrypt for secure data storage and encryption
- Match request : Player can see the active players and send them an invite to play a game
- Effects : Confetti at Winning , and bomb popping at losing
- Cheat Disabled : a player can only select the tiles when its their turn

---

## 3. Game Layouts

### 3.1. Start Screen

**Title**: "2-Player Guessing Game"

**Button**: "Start Game" (Starts the game)

**Options**: "Instructions", "Settings", "Exit"

### 3.2. Gameplay Screen

**Player Status:**

Display of the current player's name.

Turn indicator: "Player 1's Turn" or "Player 2's Turn".

Remaining attempts.

Timer for each turn.

**2 button navbar at bottom**

Starting a new game.

Finding all active users.

**Progress:**

Feedback for each guess (correct/incorrect).

### 3.3. End Screen

Winner Announcement: A message displaying the winner ("Player 1 Wins!" or "Player 2 Wins!").

Stats:

Number of attempts taken by each player.

Time taken to finish the game.

Button: "Play Again" (Starts a new game) and "Exit to Main Menu".

![alt text](https://github.com/yatanbase/imagesPublic/blob/main/image.png?raw=true)

## **4. Database Design**

## Note : Every table has id, createdAt, updatedAt, deletedAt

### 1. **Players Table**

Stores information about the players.

| Column   | Type    | Description                     |
| -------- | ------- | ------------------------------- |
| email    | VARCHAR | Player's email address (unique) |
| password | VARCHAR | Player's password (hashed)      |
| username | VARCHAR | Player's username (unique)      |

### 2. **Games Table**

Stores the details of each game.

| Column         | Type        | Description                                                                               |
| -------------- | ----------- | ----------------------------------------------------------------------------------------- |
| GameId         | INT         | Unique identifier for the game                                                            |
| state          | VARCHAR(20) | Current state of the game (`waiting`, `in_progress`, `round_over`, `game_over`, `paused`) |
| WinnerPlayerId | INT         | Shows the id of player that won the game                                                  |
| startAt        | TIMESTAMP   | Timestamp when the game started                                                           |
| endAt          | TIMESTAMP   | Timestamp when the game ended                                                             |

### 4. **Moves Table**

Stores each move made by a player (tile selections, guesses, etc.).

| Column       | Type    | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| GameId       | INT     | Foreign key linking to the `Games` table         |
| PlaterId     | INT     | Foreign key linking to the `Players` table       |
| tilePosition | VARCHAR | The position of the tile (e.g., 'A1', 'B3')      |
| type         | VARCHAR | The type of move (`select`, `guess`, etc.)       |
| isCorrect    | BOOLEAN | Whether the guess was correct (only for guesses) |

### 3. **GamePlayers Table**

Links players to specific games and manages turn order.

| Column    | Type | Description                                                                                                  |
| --------- | ---- | ------------------------------------------------------------------------------------------------------------ |
| GameId    | INT  | Foreign key linking to the `Games` table                                                                     |
| PlayerId  | INT  | Foreign key linking to the `Players` table                                                                   |
| joinOrder | INT  | The order in which the player joined the game                                                                |
| turnOrder | INT  | The player's turn order in the game ( optional for now as we will consider join order to be the turn order ) |

---

## Game States

The **state** column in the `Games` table can hold the following values:

- `waiting`: The game is waiting for players to join.
- `in_progress`: The game is currently being played.
- `game_over`: The game has finished, and the winner has been declared.
- `aborted`: The game is temporarily paused.

---

## Modules

### 1. Authentication Module

### 2. Game Module

### 3. Player Module
