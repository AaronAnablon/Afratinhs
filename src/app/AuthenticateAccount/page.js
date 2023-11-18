"use client"

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { url } from '@/utils/api';

const page = () => {
    const { data: session } = useSession();
    const router = useRouter()
    if (!session) {
        router.pathname !== "/" && router.push(`${url}`)
    } else if (session.role === 0) {
        router.push(`${url}/Admin`)
    } else if (session.role === 1) {
        router.push(`${url}/Teacher`)
    }
    else if (session.role === 2) {
        router.push(`${url}/Student`)
    }
    return (
        <div className="w-screen h-screen grid items-center justify-center">
            <p>Authenticating...</p>
        </div>
    );
}

export default page;