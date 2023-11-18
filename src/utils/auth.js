import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { url } from './api';

function PublicRoute({ children }) {
    return (
        <>
            {children}
        </>)
}

function StudentRoute({ children }) {
    const { data: session } = useSession();
    const router = useRouter()

    if (!session) {
        router.push("/")
    } else if (session && session.role === 2) {
        return (
            <>
                {children}
            </>)
    }

}

function TeacherRoute({ children }) {
    const router = useRouter()
    const { data: session } = useSession();
    if (!session) {
        router.push("/")
    } else if (session && session.role === 1) {
        return <>{children}</>;
    }

}


function AdminRoute({ children }) {
    const { data: session } = useSession();
    const router = useRouter()
    if (!session) {
        router.push("/")
    } else if (session && session.role === 0) {
        return <>{children}</>;
    }
}

export { StudentRoute, TeacherRoute, AdminRoute, PublicRoute };
