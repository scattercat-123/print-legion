![print_legion](https://raw.githubusercontent.com/hackclub/print-legion/refs/heads/v2/public/media/github_banner.v1.png)
<h2 align=center>Get 3D-printed parts from your local hack-clubbers!</h2>

[![](https://img.shields.io/github/stars/hackclub/print-legion?style=flat-square&logo=github)](https://github.com/hackclub/print-legion) [![](https://img.shields.io/badge/website-print__legion.hackclub.com-red?style=flat-square)](https://printlegion.hackclub.com) [![](https://img.shields.io/badge/slack-%23print--legion-blue?logo=slack&style=flat-square)](https://hackclub.slack.com/archives/C083P4FJM46)


📦 Need something printed? Upload your STL and images, and we'll find a printer to print it for you!

🖨️ Have a 3D printer? Set your specs and wait for requests! Claim jobs, print them, meetup with the requestor and get reimbursed for filament!

🌐 Live now! Try the site - [printlegion.hackclub.com](https://printlegion.hackclub.com)

💬 Want to chat with other printers? Join [#printing-legion](https://hackclub.slack.com/archives/C083P4FJM46) on Hack Club's Slack!

## Platform features

### 📁 General features
- Slack-based authentication, Airtable as backend
- Location-based search for jobs
- Upload images and STLs directly to the site

### 📦 For submitters - people who need prints
- Submit print jobs with full metadata, STL and image uploads
- View progress updates to the job, and who's printing it
- Confirmation of parts receipt before marking as finished
- Browse and search available prints (for fun!)

### 🖨️ For people with printers
- Able to set detailed printer specs (brand, volume, etc.)
- Search to find jobs in your general area (~10km radius), easily claim ones you can deliver
- Select a preferred YSWS to print for
- Status management (claimed → printing → completed)
- Track filament usage and print details
- Set region so you don't have to travel far!

### 🚧 Roadmap
- [ ] Slack integration for easy communication - send message to person when there's an update to their print
- [ ] Automatically render + slice STL files in the cloud
  - This will let you see images of the actual item from various angles, not just user-uploaded images
  - Plus provide filament and cost estimates right in search! 
- [ ] Support for shipping items in the future (not just meetups)
- [ ] View STL files in 3D in the browser
- [ ] Autofill printer specs from internal index of printers
- [ ] Printer index system, supporting multiple printers, filament colours, etc.


## How to run locally
You'll need: 
- Airtable account
- Slack app, with redirect URI set to `https://localhost:4322/api/auth/callback/slack` and bot token
- Airtable API key (and well, [an airtable base](airtable_schema.md))

### Steps
1. Clone the repo
2. Run `bun install` to install dependencies
3. Setup your .env file (see [`.env.example`](.env.example))
4. Run `bun dev`
5. Go to `https://localhost:4322` (slack really likes https, even locally...)
6. Profit?
