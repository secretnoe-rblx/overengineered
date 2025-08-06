<h1 align="center">OverEngineered 🚀</h1>

<p align="center">
  <a href="https://discord.gg/raax9xUMDc">
    <img src="https://discord.com/api/guilds/1053774759244083280/widget.png?style=shield" alt="Join our Discord" />
  </a>
  <a href="https://join.anywaymachines.com">
    <img src="https://img.shields.io/badge/Roblox-Join%20Now-blue?style=flat-square&logo=roblox" alt="Play on Roblox" />
  </a>
  <a href="https://github.com/Maks-gaming/OverEngineered">
    <img src="https://img.shields.io/github/stars/anywaymachines/overengineered?style=flat-square" alt="GitHub Stars" />
  </a>
</p>

<p align="center">
  <strong>Roblox sandbox physics game with logic and destruction</strong>
</p>

[OverEngineered](https://join.anywaymachines.com) is a sandbox physics game on Roblox, centered around constructing mechanical and logical machines, and then testing them. From planes to cars to wild hybrids, from mini-processors to guided missles - build anything you want, then test it in a dynamic and destructible world. Currently in **beta**, join the fun at [join.anywaymachines.com](https://join.anywaymachines.com)!

---

## ✨ Key Features

- 🛠 **Destruction Physics**: Experience realistic crashes and chaotic destruction.
- 🧩 **Block-Based Building**: Craft vehicles with a flexible, customizable system.
- ⚙️ **Advanced Components**: Use thrusters, motors, hinges, and more to bring your creations to life.
- 🧠 **Powerful logic**: Wire up logic blocks to make your creations do whatever you want, or even write your own lua code!
- 💻 **Powered by roblox-ts**: Built with a modified [roblox-ts](https://roblox-ts.com) for the best experience of TypeScript.

## ⚠️ Disclaimer

*This is a game. Don’t try this in real life.*

OverEngineered is all about safe, creative gameplay. It does not condone or replicate harmful real-world actions or events. Any similarities are purely coincidental.

## ⚠️ Disclaimer 2

This game has been a target of over 200 false DMCA strikes since the end of 2023, and going. Since the official place constantly gets taken down, to find it use our official link https://join.anywaymachines.com.

*Your saves are almost save with our 5 minute auto-saving system*

---

## 🛠 Getting Started

Get up and running with OverEngineered's development environment in just a few steps:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/anywaymachines/overengineered.git
   cd overengineered
   ```

2. **Install Dependencies**

   It is recommended to use **Node.js v20 LTS** for best compatibility. Download it from the [official site](https://nodejs.org/).

   Ensure Node.js is installed, then run:

   ```bash
   npm install
   ```

3. **Download Rokit**

   Download and install [rokit](https://github.com/rojo-rbx/rokit) (required for asset and place management):

   ```bash
   # Download and follow instructions from https://github.com/rojo-rbx/rokit
   ```

4. **Assemble the Place File**

   Before starting Rojo or working in Roblox Studio, you must assemble the place file:

   ```bash
   lune run assemble
   ```

   This will generate or update `place.rbxl` using the current assets and structure.

5. **Run the Build Watcher**

   In a separate terminal, start the TypeScript compiler in watch mode:

   ```bash
   npm run watch
   ```

   This compiles TypeScript/roblox-ts code into Roblox Lua in real-time.

6. **Start Rojo**

   Install [Rojo](https://rojo.space/) in Roblox Studio, then launch the server:

   ```bash
   rojo serve
   ```

7. **Open Roblox Studio and Connect Rojo**

   - Open Roblox Studio.
   - In Roblox Studio, open the generated `place.rbxl` file.
   - After the place is open, navigate to **Plugins → Rojo → Connect** to connect Rojo.
   - Your local code and assets will sync automatically with the Roblox environment.

8. **Start Building!**

   Make changes locally and watch them come to life in Roblox Studio.

## 📝 License

This project is licensed under a custom non-commercial license. See [LICENSE](LICENSE) for details.
