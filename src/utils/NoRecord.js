import Image from 'next/image';
import React from 'react';
import { FcDeleteDatabase } from "react-icons/fc";

export const NoRecord = ({ loading }) => {
    return (
        loading && (
            <div className='w-full h-full flex gap-4 justify-center items-center'>
                <FcDeleteDatabase size={120} />
                <p>No record found!</p>
            </div>
        )
    );
};
