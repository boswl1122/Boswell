// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Enables proper mobile scaling */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Optional: nicer mobile address-bar color */}
        {/* <meta name="theme-color" content="#b45a06" /> */}
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}