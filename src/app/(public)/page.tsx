import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
      <Link href="/dashboard">
        <Button>Entrar</Button>
      </Link>
    </div>
  )
}
