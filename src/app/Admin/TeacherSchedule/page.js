"use client"

import { IoMdArrowBack } from "react-icons/io";
import Layout from "../Layout";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BsFillTrash3Fill } from "react-icons/bs";
import axios from "axios";
import AddTeacherAccount from "./AddTeacherAccount";
import { LoadingSpin } from "@/utils/LoadingSpin";
import { url, headers } from "@/utils/api";
import useConfirmation from "@/utils/ConfirmationHook";
import { FcDataProtection } from "react-icons/fc";
import { FaClipboardList, FaEdit } from "react-icons/fa";
import Modal from "@/utils/Modal";
import useMessageHook from "@/utils/MessageHook";
import EditTeacherAccount from "./EditTeacherAccount";

const Page = () => {
    const { showMessage, Message } = useMessageHook();
    const { showConfirmation, ConfirmationDialog } = useConfirmation();
    const [add, setAdd] = useState(false)
    const [edit, setEdit] = useState(false)
    const [clickedStudent, setClickedStudent] = useState()
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
        success && showMessage("Successfully Added")
    }, [success])

    const handleGetData = async () => {
        setLoading(true)
        try {
            const response = await axios.get(`${url}/api/people/getTeachers`, { headers });
            setTeachers(response.data)
            setLoading(false)
        } catch (err) {
            setLoading(false)
            showMessage("Something went wrong while fetching teachers!")
            console.log(err);
        }
    }

    const handleDeleteData = async (id) => {
        setLoading(true)
        try {
            const response = await axios.delete(`${url}/api/people/${id}`, { headers });
            await axios.delete(`${url}/api/attendance/getAttendanceById/${id}`, { headers });
            setLoading(false)
            handleGetData()
            showMessage("Successfully Deleted!")
        } catch (err) {
            setLoading(false)
            showMessage("Something went wrong while deleting teachers!")
            console.log(err);
        }
    }

    const handleDeleteAttendance = async (id) => {
        try {
            const deleteAttendance = await axios.delete(`${url}/api/attendance/getAttendanceById/${id}`, { headers });
        } catch (err) {
            setLoading(false)
            showMessage("Something went wrong while deleting teachers!")
            console.log(err);
        }
    }

    const handleDelete = (id) => {
        showConfirmation(<div className='grid justify-center gap-4'>
            <div className='bg-green-700 flex items-center text-white gap-4 rounded-t-lg w-full'><FcDataProtection size={32} />Delete Teacher</div>
            <div className="flex justify-center italic text-xs">
                <p className='w-3/4'>This will delete the teacher&#39;s data including the attendance created under his or her schedule.</p>
            </div>
            <p className='text-xl p-6'>Are you sure you want to delete teacher?</p>
        </div>, () => {
            handleDeleteAttendance(id)
            handleDeleteData(id)
        });
    };

    const handleEdit = (student) => {
        setClickedStudent(student)
        setEdit(!edit)
    }

    useEffect(() => {
        handleGetData()
    }, [])

    return (
        <Layout>
            <Message />
            <ConfirmationDialog />
            {loading &&
                <Modal>
                    <LoadingSpin loading={loading} />
                </Modal>}
            {edit && <EditTeacherAccount setEdit={setEdit} edit={edit} student={clickedStudent} handleGetData={handleGetData} />}
            <div className="flex justify-start md:justify-center mb-20">
                <ul className="grid w-full gap-2">
                    {teachers?.map((item, index) => (
                        <li className="mx-6 rounded-lg px-4 py-1 flex justify-between items-center gap-4 bg-green-700 text-white" key={index}>
                            <Link className=""
                                href={`TeacherSchedule/Schedule/?id=${item.id}`}>
                                {item.firstName} {item.lastName}
                            </Link>
                            <div className="flex gap-2">
                                <button type="button"
                                    onClick={() => handleEdit(item)}
                                    className="bg-white border-green-700 border-2 h-max rounded-full text-green-700 p-1">
                                    <FaEdit size={14} />
                                </button>
                                <Link href={`TeacherSchedule/Schedule/?id=${item.id}`}
                                    className="rounded-full bg-white text-yellow-500 h-max p-1">
                                    <FaClipboardList size={15} />
                                </Link>
                                <button type="button"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={loading}
                                    className={`rounded-full bg-white text-red-700 h-max p-1`}>
                                    <BsFillTrash3Fill />
                                </button>
                            </div>

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