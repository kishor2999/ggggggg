import Link from "next/link";

export default function Footer() {
    return (
        <>
            <footer className="w-full border-t bg-sky-950 text-white py-12 flex flex-col items-center">
                <div className="container grid gap-8 px-4 md:px-6 lg:grid-cols-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">

                            <span className="text-xl font-bold">CleanDrive</span>
                        </div>
                        <p className="text-sm text-sky-300">
                            The complete management solution for car wash businesses of all sizes.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Product</h3>
                        <ul className="space-y-2 text-sm text-sky-300">
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Integrations
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Updates
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Resources</h3>
                        <ul className="space-y-2 text-sm text-sky-300">
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Tutorials
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Support
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Company</h3>
                        <ul className="space-y-2 text-sm text-sky-300">
                            <li>
                                <Link href="#" className="hover:text-white">
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Careers
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-white">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="container flex flex-col gap-2 sm:flex-row py-6 items-center px-4 md:px-6 border-t border-sky-800 mt-8">
                    <p className="text-xs text-sky-400">&copy; {new Date().getFullYear()} CleanDrive. All rights reserved.</p>
                    <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                        <Link href="#" className="text-xs text-sky-400 hover:text-white">
                            Terms of Service
                        </Link>
                        <Link href="#" className="text-xs text-sky-400 hover:text-white">
                            Privacy
                        </Link>
                        <Link href="#" className="text-xs text-sky-400 hover:text-white">
                            Cookies
                        </Link>
                    </nav>
                </div>
            </footer>
        </>
    )
}