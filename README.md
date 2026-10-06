# Practice Hub

A practice timer + log for kids. Tap an activity, run the countdown, log the session.
All data stays in `localStorage` on the device — nothing leaves the phone.

- **Home:** grid of activity cards (Violin, Reading, Homework, Typing, Volleyball, Writing)
- **Timer:** big countdown, Start/Pause/Reset, confetti celebration on completion
- **Writing:** two modes — 🎲 Prompts (28 story prompts + textarea with live word count)
  and 📚 Stories (Story Mode, see below)
- **Story Mode:** shelf-first "continue the story" flow —
  - Shelf with two big doors: ✨ **New story** (pick 1 of 3 cliffhanger starters, 12 total)
    or 📖 **Continue yesterday's story** (jumps straight back into the latest story)
  - 👨 **Dad starts one**: Robert writes the opening lines, Kate writes Chapter 1 next
  - Chapter writing with Kate/Dad author toggle, 100-word goal bar, autosaved drafts
  - Read-back view stitches starter + chapters into one clean story
  - Stories persist in localStorage; chapters accumulate across days
- **Today:** checklist of what's done vs todo
- **Streak:** fire streak + last-14-days stars
- **History:** past completions grouped by date

## Deploy

Same dance as the other apps:

```bash
mkdir -p ~/Projects/web/practice && cd ~/Projects/web/practice
unzip ~/Downloads/practice-hub.zip
git init -b main && git add -A && git commit -m "Practice Hub v1"
gh repo create Shabowmon/practice --public --source=. --push
```

Then Cloudflare Workers & Pages → create a new app from the `Shabowmon/practice` repo
(deploy command `npx wrangler deploy`, no build command), and add the custom
domain `practice.robertnaanos.com`.

Git pushes to `main` auto-deploy.
