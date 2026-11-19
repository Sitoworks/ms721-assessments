# MS-721 Knowledge Assessments

Pre and post knowledge checks for the course **MS-721: Plan, configure and manage collaboration communications systems with Microsoft Teams** (Exam MS-721, Collaboration Communications Systems Engineer).

- **Pre-assessment:** 30 questions, about 25 minutes
- **Post-assessment:** 50 questions, about 50 minutes
- Instant scoring, topic breakdown, explanations and Microsoft Learn links for learners
- Trainer dashboard with pre/post comparison, charts, question analysis and CSV export
- Results are stored in **your own Google Sheet** through a small Google Apps Script
- Static files only, so it hosts for free on **GitHub Pages**

> These are course knowledge checks, not Microsoft certification exams, and they do not reproduce Microsoft exam content.

## What is in this folder

| File | Purpose |
|---|---|
| `index.html` | The learner page (share this link with the class) |
| `trainer.html` | The trainer console (password protected through the Apps Script) |
| `config.js` | One line: the web app URL of your Apps Script (you fill this in) |
| `Code.gs` | The Google Apps Script backend. It is **pasted into Google**, not hosted on GitHub |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
| `.gitignore` | Keeps the private `tools/` folder out of GitHub |
| `tools/` | Private question source and build scripts (optional; keep off GitHub) |

---

## Part A. Create the Google Sheet and the Apps Script

Do this once per course. Use a **new** sheet for MS-721 so its results never mix with another course.

1. Go to <https://sheets.google.com> and create a blank spreadsheet. Name it `MS-721 Assessment Results`.
2. In the sheet choose **Extensions > Apps Script**.
3. Delete the sample code, open `Code.gs` from this folder, copy everything and paste it in.
4. Near the top, replace `CHANGE-ME-BEFORE-DEPLOYING` with your own long trainer password. This is the password you will type on the trainer page.
5. Select **Save**.
6. Select **Deploy > New deployment**. Next to "Select type" choose **Web app**.
7. Set **Execute as: Me** and **Who has access: Anyone**. Select **Deploy** and approve the permission prompts (Google may show an "unverified app" notice for your own script; choose **Advanced** and continue).
8. Copy the **Web app URL**. It ends in `/exec`.
9. Test it: open that URL in a browser. You should see `MS-721 results service is running.`

The script creates the **Results** and **Settings** tabs by itself the first time they are needed.

**If you change `Code.gs` later:** choose **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**. The URL stays the same.

## Part B. Connect the pages to your sheet

1. Open `config.js` and paste the URL between the quotes:

   ```js
   window.MS721_API = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```

2. Save the file. Both pages read it automatically.

Until this is filled in, learners still see their score, and the results page shows a **result code** they can send to you (WhatsApp or email). You can paste those codes on the trainer page under **Import and export**.

## Part C. Publish on GitHub Pages

1. Create a new repository on GitHub, for example `ms721-assessments`.
2. Upload these files to the root of the repository: `index.html`, `trainer.html`, `config.js`, `Code.gs`, `README.md`, `.nojekyll`, `.gitignore`.
   Keep `Code.gs` as the placeholder version. **Never commit your real trainer password.**
3. Open **Settings > Pages**. Under "Build and deployment" choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute your site is live:
   - Learners: `https://<your-user>.github.io/ms721-assessments/`
   - Trainer: `https://<your-user>.github.io/ms721-assessments/trainer.html`
5. Optional: make a QR code of the learner link for the classroom screen.

Notes:
- GitHub Pages sites from free public repositories are public. The trainer page is public too, but it shows only a sign-in box until the correct password is entered. Results are protected by the password, not by hiding the page.
- Pages from a **private** repository depend on your GitHub plan.
- Both pages keep their data in the browser under names starting `ms721.`, so they do not clash with other course assessments hosted on the same `github.io` account.

## Part D. Running the session

1. Share the learner link. Learners choose **Pre** or **Post**, enter their name (and ideally the same email or ID both times), and start.
2. Learners can go back, flag questions and resume if their browser closes. Questions and answer options are shuffled for each attempt.
3. When a learner submits, the result goes to your sheet automatically. If their connection fails, the page keeps retrying and offers the result code as a backup.
4. Open `trainer.html`, sign in, and the dashboard refreshes every 30 seconds. Use **Sync now** for an instant refresh.
5. **Settings and controls** lets you open or close the pre and post assessments, switch explanations on or off, allow retakes, and set the pass benchmark (default 70%). These are saved in the **Settings** tab of your sheet.
6. Export CSVs after each session. Your sheet's **Results** tab is the permanent record.
7. Use the **Demo data** source on the trainer page to rehearse. Demo data is kept separate from real results.

**Pre/post matching:** results are matched on the learner ID (or email) when both were entered, otherwise on the name. Name-only matches are labelled "name match" on the dashboard.

## Part E. About the question bank

The questions are mapped to the four skill areas of the MS-721 study guide (skills measured as of 29 October 2026), and written from the five-day MS-721T00 course slides (Learning Path 1: Plan and design; Learning Path 2: Manage).

| Skill area | Exam weight | Pre | Post | Question IDs |
|---|---|---|---|---|
| Plan and design collaboration systems | 20-25% | 7 | 12 | P01-P07, Q01-Q12 |
| Meetings, webinars and town halls | 15-20% | 6 | 9 | P08-P13, Q13-Q21 |
| Teams Phone | 30-35% | 10 | 17 | P14-P23, Q22-Q38 |
| Teams Rooms and devices | 20-25% | 7 | 12 | P24-P30, Q39-Q50 |

- **Pre:** 9 beginner, 13 intermediate, 8 advanced (3 "Select TWO").
- **Post:** 13 beginner, 24 intermediate, 13 advanced (3 "Select TWO").
- Every question has an explanation. The "Source" link on each question goes to the Microsoft Learn MS-721 study guide; swap in specific Learn or Teams documentation links if you prefer.
- **Q21 (eCDN) and Q50 (hotline)** come from the study guide rather than the course slides. Delete or replace them if you only want content taught in class.
- Some details (device features, licensing and limits) change over time. Check the Microsoft Learn pages before reusing the bank in a later course run.
- Multiple-select questions are correct only when every right option, and no wrong one, is chosen.

## Part F. Editing the questions or reusing this for another course

The question source is `tools/questions.py` (private, because it holds the plain-text answers).

1. Edit `tools/questions.py`: each question is `(id, skill area, difficulty, type, question, [correct answers], [wrong answers], explanation)`. Type `s` is single answer and `m` is "Select TWO".
2. Run `python3 tools/build_bank.py` from the folder that contains `index.html`. It checks the counts, rebuilds the hashed answer keys and rewrites the question data inside `index.html` and `trainer.html`.
3. Upload the two HTML files to GitHub again.

For a **new course**, copy this folder and change these things together:
- Titles, header text, logo letters and `sessionLabel` in both HTML files
- `SALT` and `SECRET` in both HTML files, and `SECRET` in `Code.gs` (all three must match; the result code prefix `MS721` appears in all three files)
- The `ms721` storage key prefix and the `MS721_API` name
- Create a **new** Google Sheet and Apps Script (Part A) and a new URL in `config.js`
- Replace the questions as above

The simplest route is to give Claude the new course materials and these files and ask for the same rebuild.

## Part G. Limits and security

- Scoring runs in the learner's browser. Answer keys are stored as hashes and explanations are encoded, so they are not readable in the page text, but a determined developer could recover them. Use these as knowledge checks, not as proctored exams.
- Result codes are signed to deter casual editing. The signing key is inside the page, so they are not tamper-proof.
- The trainer password is checked by the Apps Script, with a one-second delay per wrong attempt and a 10-minute lock after 20 wrong attempts. It is never stored in the page.
- Learner results are stored in your Google Sheet. The trainer console also caches a copy in the browser while you are signed in; **Sign out** clears it.
- If a learner reports a wrong result, delete the row in the **Results** tab of the sheet. Results re-sync to the dashboard.

## Test summary (before delivery)

- All 80 questions were graded programmatically: the keyed answer scores correct, a wrong option scores incorrect, and a partly correct multi-select scores incorrect.
- A headless browser completed a full pre and post attempt, submitted results to a mock backend, and signed in to the trainer dashboard with no console errors. The real Google Apps Script has not been run, so complete the Part A test step after deploying.
