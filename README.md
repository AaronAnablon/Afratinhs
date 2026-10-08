# AFRATINHS

Attendance Facial Recognition App for Talangan Integrated National High School. Admins manage teachers, schedules, sections and students; teachers take attendance by recognizing students' faces through a webcam; students check their attendance and upload excuse letters.

## Demo accounts

The homepage lists demo Admin, Teacher and Student logins that visitors can use with one click.

1. Copy `.env.local.example` to `.env.local` and fill in the database and Cloudinary values. The `NEXT_PUBLIC_DEMO_*` variables hold the demo emails and passwords.
2. Run `npm run seed:demo` to create the three accounts, a "Demo Section" and a few class schedules. Running it again resets the demo passwords and schedules.
3. On Vercel, add the same `NEXT_PUBLIC_DEMO_*` variables to the project settings and redeploy.

Anyone using the admin demo can view and change every record, so use a separate database for a public demo.

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
