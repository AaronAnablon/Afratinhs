# AFRATINHS

Attendance Facial Recognition App for Talangan Integrated National High School. Admins manage teachers, schedules, sections and students; teachers take attendance by recognizing students' faces through a webcam; students check their attendance and upload excuse letters.

## Demo accounts

The homepage lists demo Admin, Teacher and Student logins that visitors can use with one click. The emails and passwords are in `src/globalData/demoAccounts/accounts.json`.

1. Copy `.env.local.example` to `.env.local` and fill in the database, `NEXTAUTH_SECRET` and Cloudinary values.
2. That's it: the first demo login creates the accounts. `npm run seed:demo` rebuilds them and deletes every visitor's demo data.
3. On Vercel, set `NEXTAUTH_SECRET` (required, logins fail without it) and `CRON_SECRET` to long random strings. `vercel.json` calls `/api/demo/reset` every night at 16:00 UTC (midnight in the Philippines) to delete expired visitors' data.

Every visitor gets their own demo (`src/utils/demoVisitor.js`):

- A browser that logs into a demo account without an `afratinhs_visitor` cookie, or with an expired one, is a new visitor: it gets a new random ID in that cookie (a `Demovisitors` record) and its own copy of the premade data. Records in that copy are tagged with the ID (`demoVisitorId`), and demo users only ever see their own copy plus the three shared demo accounts, so visitors never see each other's changes.
- A new visitor has to register their face at `/DemoFace` before using the app, whichever demo account they logged in with. It takes 3 photos from slightly different angles (webcam or uploaded, with consent), which makes recognition more accurate. Only the 128-number face descriptors are stored, never the photos.
- When the demo Teacher records attendance, the only face used for Demo Student is the current visitor's. Face photo uploads for other students are turned off in the demo.
- After 24 hours the cookie expires and the visitor's data and face are deleted; the next login starts over as a new visitor.
- Each login also starts a 20-minute "Live demo class" for Demo Teacher and Grade 10 - Rizal in the visitor's own time zone, so attendance can be taken right away. Logging in again within those 20 minutes, e.g. as another role, keeps the same class.
- A demo guide at the top of every page lists what to try for the current role, checks off steps as the visitor goes, and can switch to another demo account in one click.
- The three demo accounts are shared by all visitors and can't be edited, deleted or given a profile photo.

Premade data in each visitor's copy (`src/utils/demoSeed.js`):

- Demo Teacher plus two sample teachers, and three sections (Grade 10 - Rizal, Grade 9 - Mabini, Grade 8 - Luna) with 19 sample students. Demo Student is in Grade 10 - Rizal.
- The same daily timetable from 3 days ago to 3 days ahead, dated in the visitor's time zone. Past classes have attendance taken, and Demo Student missed one so visitors can upload an excuse letter.
- Sample people can't log in and have no face photos. Accounts a visitor creates can log in, but only from that visitor's browser.

To turn the demo off on a deployment, set `NEXT_PUBLIC_DEMO_MODE=false`.

## Access rules

Every API route checks the login session and role (`src/utils/apiAuth.js`): admins manage everything in their scope, teachers only see and edit their own classes, and students only see their own section and attendance. Responses never include password hashes.

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
