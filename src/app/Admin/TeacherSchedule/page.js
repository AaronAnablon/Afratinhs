"use client"

import { IoMdArrowBack } from "react-icons/io";
import Layout from "../Layout";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Modal from "@/utils/Modal";
import axios from "axios";
import AddTeacherAccount from "./AddTeacherAccount";
import { LoadingSpin } from "@/utils/LoadingSpin";
import { url, headers } from "@/utils/api";

const Page = () => {
    const [add, setAdd] = useState(false)
    const [teachers, setTeachers] = useState()
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)
    const currentPathname = usePathname()
    const [active, setActive] = useState()
    useEffect(() => {
        setActive(currentPathname)
    }, [currentPathname])
    const router = useRouter();
    const goBack = () => {
        router.back();
    };

    useEffect(() => {
        success && alert("Successfully Added")
    }, [success])

    const handleGetData = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${url}/api/people/getTeachers`, { headers });
            setTeachers(response.data)
            setLoading(false)
        } catch (err) {
            alert("Something went wrong while fetching teachers!")
            console.log(err);
            setLoading(false)
        }
    }

    useEffect(() => {
        handleGetData()
    }, [])

    return (
        <Layout>
            <div className="w-full flex justify-start md:justify-center">
                <LoadingSpin loading={loading} />
                <ul className="w-full md:w-1/4 grid gap-2">
                    {teachers?.map((item, index) => (
                        <li className="" key={index}>
                            <Link className="mx-6 rounded-lg px-4 flex gap-4 bg-green-700 text-white"
                                href={`TeacherSchedule/Schedule/?id=${item.id}`}>{item.firstName} {item.lastName}</Link>
                        </li>
                    ))}
                </ul>
            </div>
            <div className={`fixed bottom-2 flex w-full justify-center`}>
                <div className={`flex justify-between mx-4 ${active === "/Admin" ? "grid gap-2 w-full" : "w-full md:w-1/4"}`}>
                    <Link href={"/Admin"} className="bg-green-700 text-white px-4 rounded-full" >Back</Link>
                    {!add && <button type="button" onClick={() => setAdd(!add)} className="bg-green-700 text-white px-4 rounded-full">Add</button>}
                </div>
            </div>
            {add &&
                <AddTeacherAccount handleGetData={handleGetData} role={1} setSuccess={setSuccess} setAdd={setAdd} add={add} />
            }
        </Layout>
    );
}

export default Page;