# Build log: Claude for Glasses

Condensed transcript of the Claude Code session that built this app (user messages mostly verbatim or trimmed, replies summarized). Tool output and system messages are omitted. The API key was never shared in this chat.

## You

Build me a custom Claude UI as a web app for my meta display glasses, give them full option to listen to voice so I can dictate, display Claude’s answers on the display, and provide an option to read the results back to me

I already have the developer mode enabled, I just mainly need a web app url that I can enter into my meta app, and a way to make sure my session goes back to this login. I also want to be able to access previous chats

## Claude

I built a single-file web app at glasses-claude/index.html and pushed it to branch claude/happy-fermat-kpuzeu. Features: black high-contrast 600x600 layout; dictation via the browser's SpeechRecognition (🎤 Speak, auto-send when you stop); streamed answers with ▲/▼ page scrolling; 🔊 Read via speechSynthesis with voice/speed settings and auto-read; previous chats saved on-device; login screen with your own Anthropic API key and an optional PIN lock; reopens on your last chat. Caveats: no server, so you paste your own API key (stored only on the device); history is per-device. To get a URL: enable GitHub Pages for the branch.

## You

P

## Claude

Asked what was meant and offered options (Pages, PIN, something else).

## You

Give me GitHub instructions on mobile

## Claude

Steps: open github.com/wigginse-ship-it/first/settings/pages in the phone browser, request the desktop site, set Source to Deploy from a branch, choose branch claude/happy-fermat-kpuzeu and / (root), Save, wait about a minute.

## You

Getting a 404, what’s missing

## Claude

Checked what I could (repo public, files on the branch, Pages API not reachable from my sandbox). Listed likely causes: Pages not saved or still building, wrong URL, cache.

## You

It says
Your site is live at https://wigginse-ship-it.github.io/First/

## Claude

The repo name has a capital F and GitHub Pages paths are case-sensitive. Correct URL: https://wigginse-ship-it.github.io/First/glasses-claude/

## You

What’s the url I put in the meta ai app

## Claude

https://wigginse-ship-it.github.io/First/glasses-claude/

## You

I need to paste the api key in, is there a way to give it to you so it’s prefilled when you publish

## Claude

Declined to put the key in the code: the repo is public and scrapers would find it. Instead added an optional #key=sk-ant-… URL prefill: open it once, the key is saved on the device and removed from the address bar. Then switch the Meta app entry back to the plain URL.

## You

I’ve got the app open and working, but when it’s asks me to dictate the text into Claude, it’s not hearing me through the glasses, what’s wrong here

## Claude

Could not tell from the sandbox. Listed what each on-screen message means (unsupported, not-allowed, service-not-allowed, no-speech, audio-capture, network). The app depends on the browser's built-in speech recognition, which many in-app browsers lack. Offered a speech-to-text fallback that would need a second service.

## You

Can you take my audio input and save it to the clipboard, then paste into the Claude chat on the browser?

## Claude

I can't reach the glasses or phone from the cloud container. Added a 📋 Paste button that reads the clipboard into the message box so text dictated elsewhere can be sent.

## You

Can you have the Claude app bring up the meta keyboard as one of the options? Then I can use the dictate from there

(Earlier: I’m saying once you’re in the web app, can I dictate directly to the glasses, and have the glasses copy it to the clipboard? Then paste into the Claude web app chat)

## Claude

A web page can only put the cursor in a text box; the glasses decide which keyboard appears. Relabelled the button ⌨ Keyboard and made focus more reliable, so the keyboard's mic key can be used for dictation.

## You

How do I reload the app? Just open it again

## Claude

Close and reopen, check for the ⌨ Keyboard label, and if stale add ?v=2 to the URL. Key and chats are kept.

## You

It says my credit balance is too low, but I know I have available credits with regular Claude — can you change the app to use my regular Claude credits

## Claude

No. claude.ai plans and the API are billed separately; the app uses the API key and the Console credit balance. Add credits at console.anthropic.com → Settings → Billing, make sure the key belongs to that organization, optionally use Haiku and set a spend limit. I will not route the app through subscription login.

## You

is there a way to do this where I can just use regular credits

## Claude

Not with a custom app. Options: Claude's own apps (phone voice mode, claude.ai) or a few dollars of API credit.

## You

where is the glasses browser

## Claude

I don't know that there is a standalone browser; the user entered a URL in the Meta app developer section. Suggested checking that section.

## You

where do I add api credits to see this working

## Claude

console.anthropic.com → Settings → Billing → Add credits; check the API key is in the same organization.

## You

okay I got some promotional credits and this seems to be working -- can you push an update that connects this glasses app so that I can search and take a look through my past claude conversations and stuff -- including this conversation

(Then: basically I want to be able to push updates to my claude ui for meta glasses app, through my meta glasses app that I’ve created)

## Claude

claude.ai history is not available to apps through the API. Added: search across all saved chats (titles and message text with snippets); Import file / Paste import for the claude.ai data export (Settings → Privacy → Export data → conversations.json) or this app's own export; Export; and a Reload latest button in Settings to bypass cache after updates are pushed. Pushes to the branch redeploy via GitHub Pages automatically.

## You

also I can't thumb-scroll down through the settings and make any changes, fix that

## Claude

The scroll area lacked min-height:0 inside a flex column so it was clipped, not scrollable. Fixed, and added ▲/▼ and Done buttons in Settings.

## You

add options in the meta glasses UI that give me access to projects, artifacts, skills, give it memory so I can see the previous activity on it

## Claude

Claude's own Projects, Artifacts, Skills and Memory aren't available to apps. Built on-device versions: ☰ Menu with Previous chats, Projects (instructions per project, active project applies to new chats), Saved answers (★), Skills (saved prompts, four defaults), Memory (included in every chat, or say “remember that …”), Activity log, Settings.

## You

Make a downloadable copy of this transcript and push it to the app; give me the tools to push updates live through my glasses.

## Claude

Added this build log (transcript.md / transcript.json) and an “Update app” tool in the menu: describe a change, Claude edits the app, you preview it, then promote it live or revert.

## You

I want to be able to access my old chats from the glasses app, tell me how to do that

## Claude

Three kinds: chats made in the glasses app (Menu → Previous chats, searchable); this build session (Load build log); and claude.ai chats, which need the Export data download imported via Import file or Paste import.

## You

and by old chats, I mean the chats that are here in the current app

## Claude

Listed the sessions on the account: this one and 'Shadow Road first game design'. Offered to export a condensed transcript, warning that the repo is public.

## You

but I want to see these sessions in my claude meta glasses app I've been having you create

## Claude

Explained the connection is an exported file, not a live link. The Shadow Road session was mostly tool output (about 2 MB per 100 events), so proposed a condensed export of messages only.

## You

no need to send shadow road over

## Claude

Nothing from that session was put in the repo or app.

## You

maybe I need a different route to this. how about you create a claude UI for my meta display glasses, and all it does is access the web browser version of claude... let's build a new web app, with a new url

## Claude

Explained claude.ai can't be embedded in another page and I can't take credentials. Built a launcher at /First/claude-launcher/ with big buttons that open claude.ai pages.

## You

i can see the launcher, but it's not allowing me to gesture click from my meta glasses neural band, I can move up and down, but not make selections

## Claude

Rebuilt input handling: highlighted selection, Enter/Space/scroll/tap/click support, and a 'Last input' debug line.

## You

...maybe have it initially ask for my login / sign in credentials first

## Claude

Added a sign-in screen first (login happens on claude.ai, nothing typed or stored in the launcher) and a hold-to-open dwell selection.

## You

can you stop doing it with different versions, and just update the base link every time I ask for an update?

## Claude

Agreed: only base links from now on; ?v= was just a cache-buster.

## You

i'm still not able to click on the menu options, and it didn't allow me to sign in... or let me dictate

## Claude

Added voice commands, a 'Talk to it' option, multiple navigation attempts and a clear blocked-navigation message.

## You

so the gesture click works on the 'hold-to-open' option, fix the rest of the menu options so they also react to the same thing

## Claude

Diagnosed that pinch reaches the page but the glasses refuse to navigate away to other sites; made the blocked message large; suggested adding claude.ai/login as its own web app.

## You

the 'sign in again' hold to open fills the bar, but nothing happens when the bar is full

## Claude

Confirmed navigation is blocked from the launcher page.

## You

i tried the claude.ai/login, but I can't gesture swipe my way through the verification

## Claude

Image puzzles need tapping tiles, which the band can't do; suggested the audio challenge, other sign-in methods, or the API-key chat app.

## You

the pinch doesn't work on these

## Claude

Concluded the glasses can't complete the claude.ai login; recommended the glasses chat app.

## You

can you work me through a workflow where all I need to do is send a claude verification to my email...

## Claude

Described an email-code flow, noting the glasses must finish the login themselves and the image puzzle may still block it.

## You

the glasses-claude one using my api key works great, I just want to be able to see all of my historic chats as well

## Claude

Added From GitHub import: upload conversations.json to a private repo, read it with a fine-grained token (Contents read-only); the import keeps the newest chats that fit in storage.

## You

when i'm in the menu, the finger gestures no longer allow me to go through the other menu options

## Claude

Added up/down and scroll navigation across menu, history, library, settings and update screens, with a visible highlight.

## You

okay I mean, this is working, but I want it to connect to my regular claude and have access to everything here

## Claude

Explained no app can read claude.ai chats, Projects, Artifacts, memory or plan usage; the API key is a separate product. Suggested export/import and manual memory copy.

## You

the glasses keep saying it doesn't have repo access... (then: no fine-grained tokens, Add permissions dialogs, Watching, Administration, Metadata, 'I have the token', 'not found', 'claude-chats is a 404')

## Claude

Walked through creating a fine-grained token: repo access limited to claude-chats (and First for the update tool), Contents read-only, Metadata required. Found the claude-chats repo did not exist yet and gave steps to create it privately and upload conversations.json.

## You

It's still not connected to this personal Claude login, I'd like to see my previous chats, and this chat, and Claude code, and be able to build on this glasses app chat from my meta glasses

## Claude

(Latest request.) This log was refreshed to include the whole session so far.

## Work log

App: /First/glasses-claude/ (chat, search, import, projects, memory, skills, update tool). Launcher: /First/claude-launcher/ (shortcuts to claude.ai; blocked by the glasses from leaving the page). Branch: claude/happy-fermat-kpuzeu.
