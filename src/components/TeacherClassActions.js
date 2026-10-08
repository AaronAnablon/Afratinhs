import { HiOutlineCamera, HiOutlineClipboardDocumentCheck } from "react-icons/hi2";
import { ButtonLink } from "./ui/Button";

export const TeacherClassActions = ({ record }) => (
    <>
        <ButtonLink size="sm" icon={HiOutlineCamera} href={`/Teacher/Schedule/RecordAttendance?AttendanceId=${record.id}`}>
            Take attendance
        </ButtonLink>
        <ButtonLink size="sm" variant="secondary" icon={HiOutlineClipboardDocumentCheck} href={`/Teacher/Schedule/CopyAttendance?AttendanceId=${record.id}`}>
            Sheet
        </ButtonLink>
    </>
);
