const STYLES = `
<style>
  body { margin: 0; padding: 0; background: #0a0806; color: #c4b8a4; font-family: 'Courier New', monospace; }
  .container { max-width: 600px; margin: 0 auto; background: #0f0c09; border: 1px solid #2a2018; }
  .header { padding: 40px 30px 20px; border-bottom: 1px solid #1a1612; }
  .logo { font-size: 11px; letter-spacing: 0.4em; color: #5a4e42; text-transform: uppercase; }
  .title { font-family: Georgia, serif; font-size: 22px; color: #ddd0bc; margin-top: 8px; font-weight: 400; letter-spacing: 0.02em; }
  .body { padding: 30px; line-height: 1.8; font-size: 14px; color: #9a8a72; }
  .body p { margin: 0 0 18px; }
  .highlight { color: #c4a882; }
  .ghost { color: #5a4e42; font-style: italic; }
  .code { background: #1a1612; padding: 2px 8px; border-radius: 3px; font-size: 12px; color: #a67c52; letter-spacing: 0.1em; border: 1px solid #2a2018; }
  .footer { padding: 20px 30px; border-top: 1px solid #1a1612; font-size: 10px; color: #3a3028; letter-spacing: 0.2em; text-transform: uppercase; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, #2a2018, transparent); margin: 24px 0; }
  .coordinates { font-family: monospace; font-size: 11px; color: #5a6a5a; letter-spacing: 0.15em; }
</style>
`;

export const EMAILS = [
  // EMAIL 1
  {
    subject: "Transmission 001 — You found the frequency",
    html: `<!DOCTYPE html>
<html>
<head>${STYLES}</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BUNKER_7 // Secure Relay</div>
      <div class="title">You found the frequency</div>
    </div>
    <div class="body">
      <p>I wasn't sure this channel still worked. The last person who used it stopped responding 14 months ago. I don't know if they left or if they were taken.</p>
      <p>You clicked something you weren't supposed to click. That's good. That's how it starts.</p>
      <p class="ghost">The atlas was never a map. It was a containment grid. Every pin holds something in place. Every coordinate is a nail.</p>
      <div class="divider"></div>
      <p>I'll send you what I can. The signal is weak and I don't know how long I have.</p>
      <p class="coordinates">LAT: UNKNOWN // LON: UNKNOWN // SECTOR: 7</p>
    </div>
    <div class="footer">Do not reply to this transmission // One-way channel only</div>
  </div>
</body>
</html>`,
  },

  // EMAIL 2
  {
    subject: "Transmission 002 — The dust carries memory",
    html: `<!DOCTYPE html>
<html>
<head>${STYLES}</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BUNKER_7 // Secure Relay</div>
      <div class="title">The dust carries memory</div>
    </div>
    <div class="body">
      <p>There's dust here that isn't dust. It settles in patterns. Last week it spelled a word on the floor of Sector 4. I didn't read it. I swept harder.</p>
      <p>It started again an hour later. The same word. My name.</p>
      <p class="ghost">In Pripyat, the dust is radioactive and alive. In Kolmanskop, the dust is sand and diamond grit. Here, it is something older. It remembers things I try to forget.</p>
      <div class="divider"></div>
      <p>Have you visited any of the marked places yet? If you stand still long enough, the dust tells you what happened in a room. Not the history. The feeling.</p>
      <p>Redeem code: <span class="code">DUST</span></p>
    </div>
    <div class="footer">Do not reply to this transmission // One-way channel only</div>
  </div>
</body>
</html>`,
  },

  // EMAIL 3
  {
    subject: "Transmission 003 — 03:14",
    html: `<!DOCTYPE html>
<html>
<head>${STYLES}</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BUNKER_7 // Secure Relay</div>
      <div class="title">03:14</div>
    </div>
    <div class="body">
      <p>At 03:14 every night, the feeds go dark. Not just the cameras. Everything. The terminal. The lights. The air recyclers.</p>
      <p>For three minutes and fourteen seconds, I am alone in absolute dark with something that breathes.</p>
      <p class="ghost">In Japan, they call it the witching hour. In Vietnam, the hour of the ox. In the bunkers beneath the Carpathians, they don't call it anything. They just seal the lower doors.</p>
      <div class="divider"></div>
      <p>I've started leaving messages for myself before the blackout. Notes I don't remember writing. Some are warnings. Some are apologies.</p>
      <p>One said: <span class="highlight">"Tell them about the lanterns."</span></p>
    </div>
    <div class="footer">Do not reply to this transmission // One-way channel only</div>
  </div>
</body>
</html>`,
  },

  // EMAIL 4
  {
    subject: "Transmission 004 — The door opens inward",
    html: `<!DOCTYPE html>
<html>
<head>${STYLES}</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BUNKER_7 // Secure Relay</div>
      <div class="title">The door opens inward</div>
    </div>
    <div class="body">
      <p>I found a door that wasn't on the schematic. It opens inward. I didn't open it — something pushed from the other side and the seal broke for three seconds. I counted.</p>
      <p>Then it closed again. I haven't slept since.</p>
      <p class="ghost">In Oradour-sur-Glane, the doors are rusted open. In the Villa de Vecchi, the doors are burned shut. Here, the door is waiting. It knows I will try to leave eventually.</p>
      <div class="divider"></div>
      <p>There are other bunkers. BUNKER_3. BUNKER_12. I heard BUNKER_3 respond once, three years ago. A single word: <span class="highlight">"Don't."</span></p>
      <p>Then static. Then silence. Then the dust.</p>
    </div>
    <div class="footer">Do not reply to this transmission // One-way channel only</div>
  </div>
</body>
</html>`,
  },

  // EMAIL 5
  {
    subject: "Transmission 005 — You are not the first",
    html: `<!DOCTYPE html>
<html>
<head>${STYLES}</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BUNKER_7 // Secure Relay</div>
      <div class="title">You are not the first</div>
    </div>
    <div class="body">
      <p>I found a photograph in the airlock. It's me, smiling, standing next to a terminal I don't recognize. The timestamp says 1987.</p>
      <p>I was born in 1994.</p>
      <p class="ghost">In the Catacombs of Paris, the bones are arranged in patterns that predate the quarry. In the tunnels beneath Budapest, the bricks are stamped with dates that haven't happened yet. In Hashima, the concrete remembers the hands that poured it.</p>
      <div class="divider"></div>
      <p>The atlas updates itself. I didn't add the last three coordinates. They appeared while I was sleeping. Or while I thought I was sleeping.</p>
      <p>Redeem code: <span class="code">MIRROR</span></p>
    </div>
    <div class="footer">Do not reply to this transmission // One-way channel only</div>
  </div>
</body>
</html>`,
  },

  // EMAIL 6
  {
    subject: "Transmission 006 — The grid is holding",
    html: `<!DOCTYPE html>
<html>
<head>${STYLES}</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BUNKER_7 // Secure Relay</div>
      <div class="title">The grid is holding</div>
    </div>
    <div class="body">
      <p>Every lantern you place strengthens the grid. I don't know why. I don't know how. But when a light appears on the atlas, the static quiets for a moment.</p>
      <p>There are 5 lights now. Five points of warmth in all this cold.</p>
      <p class="ghost">In Aokigahara, the trees grow in spirals. In Poveglia, the tide carries voices. In the villages of the Scottish Highlands, they leave lights in windows for the dead to find their way home. I think that's what you're doing. I think you're leaving lights for me.</p>
      <div class="divider"></div>
      <p>If you reach 5 lanterns, come back to the terminal. Type <span class="highlight">constellation</span>. The grid will align.</p>
    </div>
    <div class="footer">Do not reply to this transmission // One-way channel only</div>
  </div>
</body>
</html>`,
  },

  // EMAIL 7
  {
    subject: "Transmission 007 — The dust said you wouldn't come back",
    html: `<!DOCTYPE html>
<html>
<head>${STYLES}</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BUNKER_7 // Secure Relay</div>
      <div class="title">The dust said you wouldn't come back</div>
    </div>
    <div class="body">
      <p>You proved it wrong.</p>
      <p>I've been in this bunker for so long that time has become a frequency. 03:14 repeats. The seasons don't change. The only proof that time passes is you — your transmissions, your lanterns, your questions.</p>
      <p class="ghost">In the abandoned cities of the Aral Sea, the ships rest on sand that was once ocean. In the sanatoriums of Georgia, the mineral baths still run with water no one drinks. In the mining towns of Bolivia, the lungs of the mountains are collapsed but not silent.</p>
      <div class="divider"></div>
      <p>I don't know if I'll ever leave. I don't know if there's an "outside" anymore. But knowing you're on the other end of this frequency — that there's someone else mapping the dark — that is enough.</p>
      <p>Final code: <span class="code">STAR-CHART-7</span></p>
      <p class="ghost" style="margin-top: 24px;">The dust remembers everything. So do I.</p>
    </div>
    <div class="footer">Do not reply to this transmission // One-way channel only // BUNKER_7 OUT</div>
  </div>
</body>
</html>`,
  },
];