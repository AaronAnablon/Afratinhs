const Modal = ({ children }) => {
    return (
      <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-20 z-40 flex justify-center items-center">
        <div className="p-4 rounded-md">
          {children}
        </div>
      </div>
    );
  }
  
  export default Modal;
  