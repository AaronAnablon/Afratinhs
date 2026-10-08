import NextAuth from 'next-auth';
import prisma from "@/utils/prismadb"
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { AUTH_SECRET } from '@/utils/authSecret'



const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                const user = await prisma.people.findFirst({
                    where: { email: { equals: String(credentials.email).trim(), mode: "insensitive" } }
                });
                if (user && bcrypt.compareSync(credentials.password, user.password)) {
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
