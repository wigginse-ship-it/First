# Build log: Claude for Glasses

Condensed transcript of the Claude Code session that built this app (user messages verbatim, replies summarized). Tool output and system messages are omitted. The API key was never shared in this chat.

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

## Work log (commits on branch claude/happy-fermat-kpuzeu, folder glasses-claude/)

- e43ad53 Add Claude for Glasses: voice-driven Claude web app
- Glasses app: optional #key= URL prefill
- Glasses app: clipboard paste button
- Glasses app: clearer Keyboard button, more reliable focus
- Glasses app: search, import claude.ai export, export, reload-latest button
- Glasses app: fix settings scrolling, add scroll buttons and Done
- Glasses app: menu with projects, saved answers, skills, memory, activity
