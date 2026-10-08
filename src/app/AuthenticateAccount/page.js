"use client"

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { url } from '@/utils/api';
import { LoadingSpin } from '@/utils/LoadingSpin';
import Modal from '@/utils/Modal';
import { isDemoEmail } from '@/globalData/demoAccounts';

const Page = () => {
    const { data: session, status } = useSession();
    const router = useRouter()

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push(`${url}`)
            return;
        }

        const goToRolePage = () => {
            if (session.role === 0) {
                router.push(`${url}/Admin`)
            } else if (session.role === 1) {
                router.push(`${url}/Teacher`)
            } else if (session.role === 2) {
                router.push(`${url}/Student`)
            }
        }

        if (!isDemoEmail(session.email)) {
            goToRolePage()
            return;
        }

        // Demo visitors register their own face before trying the app.
        axios.get("/api/demoFace")
            .then((response) => response.data.registered ? goToRolePage() : router.push("/DemoFace"))
            .catch(goToRolePage)
    }, [session, status, router])

    return (
        <div className="w-screen h-screen grid items-center justify-center">
            <Modal>
                <LoadingSpin loading={true} />
            </Modal>
        </div>
    );
}

export default Page;
