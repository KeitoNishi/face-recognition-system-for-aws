import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: '第129回日本眼科学会総会 フォトギャラリー',
  description: '顔認識機能付きフォトギャラリー',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link href="https://fonts.googleapis.com/css2?family=Sawarabi+Mincho&Noto+Sans+JP:wght@300;400;500;700&family=Noto+Serif+JP:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link href="/style.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/Modaal/0.4.4/css/modaal.min.css" />
      </head>
      <body>
        {children}
        <Script src="/jquery.min.js" strategy="beforeInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/Modaal/0.4.4/js/modaal.min.js" strategy="afterInteractive" />
        <Script src="/function.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
