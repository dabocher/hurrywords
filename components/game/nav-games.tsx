import Link from "next/link";

export const NavGames = () => (
    <nav className="flex gap-4">
        <Link href="/daily-words" className="text-gray-400 hover:text-red-300">
            Palabras del día
        </Link>
        <Link href="/palabrejas" className="text-gray-400 hover:text-red-300">
            Palabrejas
        </Link>
    </nav>
);

export default NavGames;
