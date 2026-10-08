# AFRATINHS

Attendance Facial Recognition App for Talangan Integrated National High School. Admins manage teachers, schedules, sections and students; teachers take attendance by recognizing students' faces through a webcam; students check their attendance and upload excuse letters.

## Demo accounts

The homepage lists demo Admin, Teacher and Student logins that visitors can use with one click. The emails and passwords are in `src/globalData/demoAccounts/accounts.json`.

1. Copy `.env.local.example` to `.env.local` and fill in the database, `NEXTAUTH_SECRET` and Cloudinary values.
2. Run `npm run seed:demo` to create the three accounts, a "Demo Section" and a few class schedules in that database. Running it again resets all demo data.
3. On Vercel, set `NEXTAUTH_SECRET` (required, logins fail without it) and `CRON_SECRET` to long random strings. `vercel.json` calls `/api/demo/reset` every night at 16:00 UTC (midnight in the Philippines) to rebuild the demo data.

How the demo works:

- Demo data is kept apart from real school data. Records created by demo accounts are marked `isDemo`; demo users only ever see those, and real users never see them. The nightly reset deletes everything demo users created.
- The first time a visitor logs in with a demo account, they register their face at `/DemoFace` (webcam or photo, with consent). Only the 128-number face descriptor is stored, never the photo.
- The face is tied to a random ID in a browser cookie, so visitors never share faces. When the demo Teacher records attendance, the only face used for Demo Student is the current visitor's.
- Visitor faces are deleted after 24 hours, or right away with "Delete my face".
- The three demo accounts can't be edited, deleted or given a profile photo.

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
