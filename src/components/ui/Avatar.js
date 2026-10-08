import Image from "next/image";

const SIZES = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-lg", xl: "h-24 w-24 text-2xl" };
const PIXELS = { sm: 32, md: 40, lg: 64, xl: 96 };

export const Avatar = ({ person, size = "md", className = "" }) => {
    const initials = `${person?.firstName?.[0] ?? ""}${person?.lastName?.[0] ?? ""}`.toUpperCase() || "?";
    if (person?.profile) {
        return (
            <Image
                src={person.profile}
                alt=""
                width={PIXELS[size]}
                height={PIXELS[size]}
                className={`shrink-0 rounded-full object-cover ring-1 ring-slate-200 ${SIZES[size]} ${className}`}
            />
        );
    }
    return (
        <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 ${SIZES[size]} ${className}`} aria-hidden="true">
            {initials}
        </span>
    );
};

export const fullName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ");
