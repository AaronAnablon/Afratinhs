"use client"

import Layout from "../Layout";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import axios from "axios";
import { LoadingSpin } from "@/utils/LoadingSpin";
import { url, headers } from "@/utils/api";
import { useAccount } from "@/app/contextProvider/AccountProvider";
import Link from "next/link";
import Modal from "@/utils/Modal";
import useMessageHook from "@/utils/MessageHook";

const Page = () => {
    const profile = useAccount()
    const [schedule, setSchedule] = useState()
    const [loading, setLoading] = useState(false)
    const currentPathname = usePathname()
    const [active, setActive] = useState()
    const { showMessage, Message } = useMessageHook();

    useEffect(() => {
        setActive(currentPathname)
    }, [currentPathname])

    const router = useRouter();

    const goBack = () => {
        router.back();
    };


    const handleGetData = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${url}/api/attendance/getStudents/${profile.section}`, { headers });
            setSchedule(response.data)
            setLoading(false)
        } catch (err) {
            setLoading(false)
            showMessage("Something went wrong!")
            console.log(err);
        }
    }

    useEffect(() => {
        profile && handleGetData()
    }, [profile])

    const groupByDay = () => {
        const groupedByDay = {};
        schedule?.forEach((item) => {
            const day = new Date(item.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            if (!groupedByDay[day]) {
                groupedByDay[day] = [];
            }
            groupedByDay[day].push(item);
        });

        return groupedByDay;
    };
    const groupedSchedule = groupByDay(schedule);

    return (
        <Layout>
            <Message />
            <div className="w-full flex justify-center gap-4 mb-20">
                {loading && <Modal>
                    <LoadingSpin loading={loading} />
                </Modal>}
                <div className="grid gap-4 w-full mx-4">
                    {Object.keys(groupedSchedule)?.map((day, index) => (
                        <ul className="px-6 text-white bg-green-700 rounded-lg py-2 grid " key={index}>
                            <h2 className="text-white">{day}</h2>
                            {groupedSchedule[day].map((item, itemIndex) => (
                                <li className="flex justify-between my-1" key={itemIndex}>
                                    <p>{item.time} &#40;{item.section}&#41; {item.event}</p>
                                </li>
                            ))}
                        </ul>
                    ))}
                </div>
            </div>
            <div className={`fixed bottom-2 flex w-full justify-center`}>
                <div className={`flex justify-between mx-4 ${active === "/Admin" ? "grid gap-2 w-full" : "w-full md:w-1/4"}`}>
                    <Link href={"/Student"} className="bg-green-700 text-white px-4 rounded-full" >Back</Link>
                </div>
            </div>
        </Layout>
    );
}

export default Page;