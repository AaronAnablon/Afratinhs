import NextAuth from 'next-auth';
import prisma from "@/utils/prismadb"
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'



const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                const user = await prisma.people.findMany({
                    where: { email: credentials.email, }
                });
                if (user && bcrypt.compareSync(credentials.password, user[0].password)) {
                    return user
                }
                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token = user[0]
            }
            return token
        },
        async session({ session, token }) {
            session = token
            return session;
        },
    },
    secret: 'super secret',
});

export { handler as GET, handler as POST }

