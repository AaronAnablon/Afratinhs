import axios from "axios";
import { url, headers } from "@/utils/api";
import { useState } from "react";
import Image from "next/image";
import useConfirmation from "@/utils/ConfirmationHook";
import { FcAddImage } from "react-icons/fc";
import Modal from "@/utils/Modal";
import { IoMdCloseCircle } from "react-icons/io";
import { LoadingSpin } from "@/utils/LoadingSpin";
import useMessageHook from "@/utils/MessageHook";
import { BsPersonCircle } from "react-icons/bs";

const UploadProfile = ({ handleGetStudent, setUploadProfile, uploadProfile, account }) => {
    const [file, setFile] = useState(null)
    const { showConfirmation, ConfirmationDialog } = useConfirmation();
    const [loading, setLoading] = useState(false)
    const { showMessage, Message } = useMessageHook();

    const handlePictureChange = (e) => {
        const picture = e.target.files[0];
        if (picture && picture.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.readAsDataURL(picture);
            reader.onloadend = () => {
                setFile(reader.result);
            };
        } else {
            setFile(null);
        }
    };

    const handleuploadProfile = async () => {
        setLoading(true)
        try {
            await axios.put(`${url}/api/people/uploadProfile/${account.id}`, {
                file,
                account,
            }, { headers });
            setLoading(false)
            showMessage("Successfully uploaded your profile!")
            handleGetStudent()
            setUploadProfile(false)
        } catch (error) {
            setLoading(false)
            console.error('An error occurred:', error);
            showMessage("Something went wrong!")
        }
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        showConfirmation(<div className='grid justify-center gap-4'>
            <div className='bg-red-700 flex items-center text-white gap-4 rounded-t-lg w-full'><FcAddImage size={32} />Save Profile</div>
            <p className='text-xl text-green-700 p-6'>Are you sure you want to upload this as your profile?</p>
        </div>, () => {
            handleuploadProfile()
        });
    };

    return (
        <div>
            <Modal>
                <Message />
                <ConfirmationDialog />
                <div className="relative p-7 bg-gray-300 rounded-lg">
                    <button
                        type="button"
                        className="absolute -top-2 -right-2 text-gray-500 hover:text-gray-700 rounded-full bg-white"
                        onClick={() => setUploadProfile(!uploadProfile)}
                    >
                        <IoMdCloseCircle size={28} style={{ color: 'red' }} />
                    </button>
                    <form onSubmit={handleUpdate} className="grid gap-4 justify-center">
                        <div className="grid justify-center">
                            <div className="w-60 h-60 rounded-full object-fill bg-green-700 overflow-hidden border-4 border-white mb-4">
                                {file ?
                                    <Image
                                        src={file}
                                        alt="Selected"
                                        width={600}
                                        height={600}
                                        className="object-fill"
                                    />
                                    :
                                    account.profile ? <Image
                                        src={account.profile}
                                        alt="Selected"
                                        width={600}
                                        height={600}
                                        className="object-fill"
                                    /> :
                                        <BsPersonCircle size={44} />
                                }
                            </div>

                            <div className="flex italic text-black justify-center">Image Preview</div>
                        </div>
                        <div className="grid gap-4 justify-center">
                            <div className="rounded-lg w-40 h-max bg-green-700">
                                <input
                                    id="inputFile"
                                    type="file"
                                    className="w-40 "
                                    onChange={handlePictureChange}
                                    accept="image/jpeg, image/png"
                                    required
                                />
                            </div>
                            <button type="submit"
                                disabled={loading}
                                className={`bg-green-700 text-white w-40 h-max rounded-lg`}>
                                {loading ? <LoadingSpin loading={loading} /> : "UPLOAD"}</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default UploadProfile;