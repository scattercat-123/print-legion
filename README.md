# Print Legion
A platform to connect Hack clubbers who need their YSWS parts printed with those who have a 3D printer!

[Live now!! Try it out](https://printlegion.hackclub.com)! • Join [#printing-legion](https://hackclub.slack.com/archives/C083P4FJM46) for more info.

## Features

### General features
- Slack-based authentication, using Airtable as the database
- Role-based system (Printer vs Requestor)
- Terminal-style theme throughout the site
- Able to define location/printer availability
- File upload support directly to airtable

### For people who need prints
- Submit print jobs with full metadata, STL and image uploads
- View progress updates to the job, and who's printing it
- Confirmation of parts receipt before marking as finished
- Browse and search available prints (for fun!)
- View your own past prints

### For people with printers
- Able to set detailed printer specs (brand, volume, etc.)
- Search to find jobs in your general area (~5km radius), easily claim ones you can deliver
- Select a preferred YSWS to print for
- Status management (claimed → printing → completed)
- Track filament usage and print details
- Set region so you don't have to travel far!

### Other stuff (coming soon):
- Slack integration for easy communication - send message to person when there's an update to their print
- Automatically render + slice STL files in the cloud
  - This will let you see images of the actual item from various angles, not just user-uploaded images
  - Plus provide filament and cost estimates right in search! 
- Support for shipping items in the future (not just meetups)
- View STL files in 3D in the browser
- Autofill printer specs from internal index of printers


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