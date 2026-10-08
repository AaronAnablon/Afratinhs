import NextAuth from 'next-auth';
import prisma from "@/utils/prismadb"
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { AUTH_SECRET } from '@/utils/authSecret'
import { isDemoEmail } from '@/globalData/demoAccounts'
import { ensureDemoAccounts } from '@/utils/demoSeed'
import { getVisitorId } from '@/utils/demoVisitor'



const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                const email = String(credentials.email).trim();
                // Demo logins always find their accounts ready.
                if (isDemoEmail(email.toLowerCase())) {
                    await ensureDemoAccounts(prisma).catch((error) => console.error("Demo account check failed", error));
                }
                // Every demo visitor's copy of the demo data reuses the same
                // emails, so only real accounts, the shared demo accounts and
                // this browser's own demo data can log in, and the password
                // decides between them.
                const visitorId = await getVisitorId();
                const candidates = await prisma.people.findMany({
                    where: {
                        email: { equals: email, mode: "insensitive" },
                        OR: [
                            { demoVisitorId: { isSet: false } },
                            { demoVisitorId: null },
                            ...(visitorId ? [{ demoVisitorId: visitorId }] : []),
                        ],
                    }
                });
                const user = candidates.find((person) => bcrypt.compareSync(credentials.password, person.password));
                if (user) {
                    // Never put the password hash in the session.
                    const { password, ...safeUser } = user
                    return safeUser
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token = user
            }
            return token
        },
        async session({ token }) {
            return token;
        },
    },
    secret: AUTH_SECRET,
});

export { handler as GET, handler as POST }
