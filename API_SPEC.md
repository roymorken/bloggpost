# API_SPEC.md

## Base
`/api/v1`

## Import
### POST /imports
Upload CSV/XLS/XLSX and create batch.

Response:
```json
{
  "importBatchId": "uuid",
  "rowCount": 120,
  "status": "validated"
}
```

### GET /imports/:id
Get import batch details.

## Suppliers
### GET /suppliers
List suppliers.

### POST /suppliers
Create supplier.

### PATCH /suppliers/:id
Update supplier.

## Blog Posts
### GET /blog-posts
Query params:
- supplierId
- status
- q
- page
- pageSize

### GET /blog-posts/:id
Get blog post with latest check summary.

## Jobs
### POST /jobs
Start job for an import batch.

Request:
```json
{
  "importBatchId": "uuid",
  "autoGenerateReports": true,
  "autoSendEmails": false
}
```

### GET /jobs/:id
Get job summary and progress.

### POST /jobs/:id/cancel
Cancel running job.

## Blog Post Checks
### GET /blog-post-checks
Query params:
- supplierId
- statusCategory
- from
- to
- jobId

## Extracted Links
### GET /links
Query params:
- supplierId
- statusCategory
- blogPostId
- jobId

## Flight Prices
### GET /flight-prices
Query params:
- supplierId
- route
- minPrice
- maxPrice
- from
- to
- page
- pageSize

Response contains rows for both table and chart aggregation keys.

## Reports
### POST /reports
Generate report.

Request:
```json
{
  "jobId": "uuid",
  "supplierId": "uuid",
  "reportType": "supplier-summary",
  "format": "pdf"
}
```

### GET /reports
List generated reports.

### GET /reports/:id/download
Download report file.

## Email Templates
### GET /email-templates
List templates.

### PATCH /email-templates/:id
Update template.

## Email Sending
### POST /emails/send-report
Send report manually.

Request:
```json
{
  "reportId": "uuid",
  "supplierId": "uuid",
  "to": ["supplier@example.com"],
  "cc": [],
  "customMessage": "Please review the attached report."
}
```

## Dashboard
### GET /dashboard/summary
Returns:
- total suppliers
- total blog posts
- active blog posts
- 404 blog posts
- broken links
- recent price captures
- recent jobs

## Events
### GET /events/jobs/:id
Server-sent events or WebSocket topic for live job progress.

## Status categories
Common values:
- active
- not_found
- redirected
- timeout
- server_error
- unknown_error
- blocked
- no_search_form
- price_not_found
