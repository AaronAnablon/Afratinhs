import Image from 'next/image';
import React from 'react';

export const LoadingSpin = ({ loading }) => {
  return (
    loading && (
      <div className='w-full h-full flex justify-center items-center'>
        <Image src="/circles.svg" width={24} height={24} alt="Loading..." />
      </div>
    )
  );
};
