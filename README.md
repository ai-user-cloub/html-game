# Kenneth YWN / Wing — Game design portfolio

A portfolio of co-designed tabletop games and the playable one-button browser experiment, Pivot. Built with HTML, CSS, and vanilla JavaScript. Published at https://ai-user-cloub.github.io/html-game/.

## Play

Choose **Let's play**, then tap the table, use **Spin paddle**, or press **Space** with the table focused. Every press reverses the paddle's direction. Hit a ball with the moving paddle to score. A new ball arrives at 5, 10, 20, 40 points and so on, up to ten balls. The round ends when any ball falls out.

Use **Pause / Resume** to take a break or **Restart** to start a fresh round. Your personal best is saved in your browser when a round ends, when browser storage is available. Switching tabs pauses an active round.

## Run locally

Serve this directory with any static HTTP server, or open `index.html` in your browser. No installation or build step is required. Google Fonts are optional; system fonts work offline.

## Files

- `index.html`: website and game controls
- `style.css`: responsive design
- `game.js`: original pinball mechanics and game state
- `site.js`: progressive section entrances with reduced-motion support
- `favicon.svg`: site icon
- `version1.html`: retained earlier game version

GitHub Pages can serve these files directly from the root of `main`.
