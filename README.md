# Rodent's Revenge

A browser remake of the classic Windows 95 puzzle game. You play as a mouse—push blocks to squash the cats!

## Tech Stack

- **TypeScript** + **Vite** + **React** (menus)
- **Phaser 3** (game engine)
- **98.css** (Windows 95 aesthetic)
- **GitHub Pages** (hosting)

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173/rodent-revenge/](http://localhost:5173/rodent-revenge/) (base path matches GitHub Pages).

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

1. Create a GitHub repo named `rodent-revenge`
2. Push your code
3. Run:

```bash
npm run deploy
```

4. In repo **Settings → Pages**, set source to **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.

Your game will be live at `https://<username>.github.io/rodent-revenge/`.

## How to Play

- **Brown square** = You (the mouse)
- **Gray squares** = Blocks you can push
- **Orange squares** = Cats to squash
- Click an adjacent cell to move or push a block into a cat.
