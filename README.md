# Board Lens - Chess Analysis Tool

A modern web-based chess analysis application with real-time Stockfish engine integration. Analyze positions, evaluate moves, and explore chess variations with an intuitive interface.

## Live website

[BoardLens](https://boardlens.web.app/)

## Features

- **Interactive Chess Board**: Click to select pieces and drag to move with visual feedback
- **Stockfish Integration**: Real-time chess engine analysis powered by Stockfish
- **Move Evaluation**: Instant evaluation of legal moves when you click on a piece
- **Top Lines Analysis**: View the engine's top two variations for the current position
- **Configurable Thinking Time**: Adjust move preview analysis time from 0.1s to 30s
- **Position Management**: Load positions from FEN or PGN, copy current position
- **Move History**: Navigate through games with undo/redo controls and move history panel
- **Material Tracking**: Real-time display of material balance
- **Responsive Design**: Optimized for desktop and mobile devices

## Technology Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite 5
- **Chess Logic**: chess.js 1.4
- **Styling**: Tailwind CSS 3
- **Chess Engine**: Stockfish (Web Worker)
- **Linting**: ESLint 9
- **Deployment**: Firebase

## Project Structure

```
src/
├── App.jsx                 # Main app component
├── ChessBoard.jsx          # Main chess board component
├── components/
│   ├── board/
│   │   └── BoardGrid.jsx   # Visual chess board
│   ├── controls/
│   │   ├── NavControls.jsx # Game navigation buttons
│   │   └── Toolbar.jsx     # Main controls and settings
│   └── panels/
│       ├── EvalBar.jsx     # Position evaluation display
│       ├── MaterialPanel.jsx # Material balance
│       ├── MoveHistoryPanel.jsx # Move list
│       └── TopLinesPanel.jsx # Engine analysis lines
├── controllers/
│   └── GameController.js   # Game state and move logic
├── domain/
│   ├── ChessGame.js        # Chess game wrapper
│   ├── MaterialService.js  # Material calculation
│   └── MoveFormatter.js    # Move formatting utilities
└── services/
    └── StockfishEngine.js  # Stockfish engine integration
```

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/slash851/chess_stockfish.git
cd chess_stockfish
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Usage

### Playing

1. **Make Moves**: Click on a piece to select it (shows legal moves), then click a destination square or drag the piece
2. **Evaluate Moves**: Click on a piece to see the engine's evaluation for each possible move
3. **Adjust Analysis Speed**: Use the "Move Preview Thinking Time" slider to change how long the engine thinks about each move (0.1s - 30s)

### Loading Positions

- Click **Load PGN/FEN** to load a position from FEN notation or PGN text
- Click **Copy FEN** to copy the current position as FEN
- Click **Copy PGN** to copy the game as PGN notation

### Navigation

- Use **← →** buttons to step through moves
- Click **Start** and **End** to jump to the beginning or end of the game
- Click **New Game** to start a fresh game from the starting position

## Configuration

- **Engine Thinking Time**: Configure how long the engine thinks when evaluating moves by adjusting the slider
- The top-line analysis runs continuously at a fixed depth for consistent performance

## Deployment

Deploy to Firebase hosting:

```bash
npm run deploy
```

Make sure you have the Firebase CLI configured and `firebase.json` set up for your project.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
