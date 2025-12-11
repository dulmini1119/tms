import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed top-0 left-0 right-1 z-50">
        <div className="flex justify-between items-center p-1">
          <div>
            <Image src="/logo.png" alt="Logo" width={50} height={30} />
          </div>
          <div className=""><ModeToggle/></div>
        </div>

        <div className="h-[1px] w-full dark:bg-gray-900 bg-gray-100" />
      </div>

      <div className="pt-20">{children}</div>
    </>
  );
}
