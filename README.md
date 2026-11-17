# kilat-courier

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/mhdridha/kilat-courier/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/mhdridha/kilat-courier/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Kilat Courier** is a 3-lane midnight parcel-run arcade game. You ride a courier bike through a neon night city: dodge the traffic, grab glowing parcels, and drop each one at the house with the matching colour. Deliveries build your combo, crashes break it — three crashes and the run is over.

- Pick up parcels (up to 3) and deliver them by riding past the matching house
- Boost with Space, brake with Down, speed up with Up — traffic gets denser and faster the longer you survive
- Every 45 seconds you level up: rush hour brings taxis that swerve and long trucks
- Power-ups on the road: shield (survives one crash), magnet (pulls parcels in), slow-mo (the world crawls for 3 seconds)
- Close passes earn a near-miss bonus; deliveries build your combo, crashes break it — three crashes and the run is over
- Score, deliveries, combo, hearts and boost meter on the HUD; synthesized engine and effects, no audio files
- Everything is drawn in code and runs offline from static files — no network, no assets to download

## Run it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in desktop Chrome.

## How to play

- **← →** (or A/D): switch lane · **↑**: faster · **↓**: brake · **Space**: boost · **P**: pause · **M**: mute · **R**: restart
- Click a lane to ride there; click the buttons on the title and game-over screens
- Deliver a parcel at the house with the same colour for 100 × combo points

---

<sub>Entered on [make.fun](https://make.fun/?ref=brpbx0j7&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
