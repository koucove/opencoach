import Image from "next/image";
import { OpenCoachConversation } from "./opencoach_conversation";
import Head from "next/head";

export default function Home() {
  return (
    <div className="grid items-center justify-items-center min-h-screen ">
      <Head>
        <title>OpenCoach</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="flex items-center ">
          <Image
            className="dark:invert"
            src="/opencoach_icon.svg"
            alt="OpenCoach logo"
            width={180}
            height={38}
            priority
          />
          <h1>Chat with your AI coach</h1>
      </header>
      <main className="flex flex-col justify-start">
        <div><OpenCoachConversation /></div>
      </main>
      <footer>
      </footer>
    </div>
  )
}
