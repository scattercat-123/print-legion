# Airtable Setup

print_legion's Airtable schema consists of 3 tables:
- `Form` - all print jobs/requests
- `Users` - all users
- `YSWS Index` - list of all you-ship-we-ships 

---

### Structure: `Form` Table (Job Schema)

| Field Name                        | Airtable Type                   | Description                                                               |
|-----------------------------------|---------------------------------|---------------------------------------------------------------------------|
| creator                           | Linked Record (→User)           | Reference to the creator(s) of the job. Example: `["rect0PI1RBEOvQee0"]`. |
| (auto)(creator)slack_id           | Lookup field (string)           | Auto-populated Slack ID(s) for the creator.                               |
| (auto)(creator)region_coordinates | Lookup field (string)           | Auto-populated region coordinates for the creator.                        |
| ysws                              | Lookup field (multiple strings) | Reference to the YSWS record. Example: `["rect0PI1RBEOvQee0"]`.           |
| (auto)(ysws)name                  | Lookup field (string)           | Auto-populated YSWS name(s) from the reference (e.g., `["Hackpad"]`).     |
| need_printed_parts                | Boolean (default: true)         | Indicates if printed parts are needed for this job.                       |
| part_count                        | Number                          | Count of parts required for the job.                                      |
| stls                              | Attachment                      | Array of attachments for STL files.                                       |
| user_images                       | Attachment                      | Array of attachments for user-uploaded images.                            |
| ysws_pr_url                       | URL (Text)                      | URL linking to the YSWS print version, if available.                      |
| assigned_printer                  | Linked Record (→User)           | Reference to the assigned printer's record.                               |
| (auto)(assigned_printer)slack_id  | Lookup field (string)           | Auto-populated Slack ID(s) for the assigned printer.                      |
| status                            | Single Select (Enum)            | Job status. [Values: see below](#job-status-enum).                        |
| item_name                         | Text                            | Name of the ordered item.                                                 |
| item_description                  | Long Text                       | Detailed description of the job/item.                                     |
| last_modified                     | Last Modified                   | Timestamp of the last modification.                                       |
| main_image_id                     | Text                            | Identifier for the main image.                                            |
| main_stl_id                       | Text                            | Identifier for the primary STL file.                                      |
| filament_used                     | Number                          | Filament used (if applicable).                                            |
| printing_notes                    | Long Text                       | Additional notes regarding the printing process.                          |
| fulfilment_photo                  | Attachment                      | Array of attachments showing fulfilment photos.                           |
| gcode_files                       | Attachment                      | Array of attachments for GCODE files.                                     |
| handoff_comments                  | Long Text                       | Comments related to job handoff.                                          |
---

### Structure: `Users` Table (User Schema)

| Field Name           | Airtable Type                         | Description                                              |
|----------------------|---------------------------------------|----------------------------------------------------------|
| slack_id             | Text                                  | Slack identifier for the user.                           |
| printer_has          | Boolean (default: false)              | Indicates whether the user has a printer.                |
| printer_type         | Text                                  | The type or model of the user's printer.                 |
| printer_details      | Long Text                             | Additional details about the printer.                    |
| preferred_ysws       | Lookup field (→YSWS Index) (multiple) | List of preferred YSWS options.                          |
| onboarded            | Boolean (default: false)              | Indicates if the user has completed onboarding.          |
| has_ever_submitted   | Boolean (default: false)              | Tracks if the user has ever submitted a print job.       |
| region_coordinates   | Text                                  | Geographical coordinates in "latitude,longitude" format. |
| region_complete_name | Text                                  | Full descriptive name of the user's region.              |

---

### Structure: `YSWS Index` Table (YSWSIndex Schema)

| Field Name   | Airtable Type | Description                               |
|--------------|---------------|-------------------------------------------|
| name         | Text          | Name of the YSWS entry.                   |
| description  | Long Text     | Description of the YSWS entry.            |
| homepage_url | URL           | Official homepage URL for the YSWS entry. |
| logo         | Attachment    | Array of attachments for the logo image.  |

---


### Job Status Enum
- **`needs_printer`**: Initial state after submission.
- **`claimed`**: Printer has claimed the job but not started printing.
- **`printing_in_progress`**: Printing has begun.
- **`completed_printing`**: Printing is finished, awaiting fulfillment.
- **`fulfilled_awaiting_confirmation`**: Fulfillment complete, awaiting confirmation from submitter.
- **`finished`**: Job is fully complete.
- **`cancelled`**: Job was cancelled by the submitter.
