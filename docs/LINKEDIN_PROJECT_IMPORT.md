# LinkedIn project import

Update: the owner subsequently removed both MC/Event Hosting entries from the public portfolio. They are archived in the database, and the import file now contains only the three software projects so they are not re-imported. The original import record below is retained for provenance.

Source: [Chairul Fitra Ramadhan — LinkedIn](https://id.linkedin.com/in/chfitra), publicly indexed profile read on 7 November 2026.

The five entries visible in the profile's Projects section were imported into the portfolio:

| Project | Period | Attribution |
| --- | --- | --- |
| Student Attendance Management System — SMAN 2 Rantau Selatan | October 2026 | Independent client project |
| MY PREMIER — Industrial Product Catalog Platform | March–July 2026 | Contributor to an existing employer platform |
| SIAKAD — MAS Aisyiyah Medan | October 2025–June 2026 | Undergraduate thesis project |
| Seminar Build Your Dream Startup | May 2023 | Master of Ceremony |
| Tausiyah & Buka Bersama — Pandemi Digital | April 2023 | Master of Ceremony |

`content/linkedin-projects.json` contains the reviewed summaries and chapter text. Software entries are featured; MC entries use the Event Hosting category. No screenshots, repository URLs, demo URLs, performance metrics, or unlisted responsibilities were fabricated. Each detail page links back to the source profile.

Run `npm run projects:import-linkedin` against the intended configured database to import this content. It validates all entries, inserts them in a transaction, and skips existing matching slugs or titles, preserving existing projects and drafts. Re-running the importer does not duplicate entries or overwrite later Studio edits.

Verification: the first import inserted five entries; the second inserted zero. Browser checks confirmed all five public cards and detail pages, source links, mobile page width, and the existing-platform attribution for MY PREMIER.
