import Script from 'next/script';
import { Nunito, Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import Navber from '../Componets/Navber';
import Navber_1 from '../Componets/Navber_1';
import Navber_2 from '../Componets/Navber_2';
import Footer from '../Componets/Footer';
import ClientProvider from './ClientProvider';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-bengali',
});

export const metadata = {
  title: 'Deluxe X Deal BD | Best Hardware Shop in Bangladesh',
  description:
    'Your one-stop hardware shop for premium quality drill machines, power tools, and industrial equipment — built to last, trusted by professionals',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: '/apple-touch-icon.png',
  },
  metadataBase: new URL('https://deluxexdeal.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Deluxe X Deal BD | Best Hardware Shop in Bangladesh',
    description:
      'Your one-stop hardware shop for premium quality drill machines, power tools, and industrial equipment — built to last, trusted by professionals',
    url: 'https://deluxexdeal.com',
    siteName: 'Deluxe X Deal BD',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${notoBengali.variable}`}>
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '${process.env.NEXT_PUBLIC_PIXEL_ID}');
    fbq('init', '${process.env.NEXT_PUBLIC_PIXEL_ID2}');

    fbq('track', 'PageView');
  `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_PIXEL_ID_2}&ev=PageView&noscript=1`}
          />
        </noscript>
        <Navber_1 />
        <ClientProvider>{children}</ClientProvider>
        <Footer />
      </body>
    </html>
  );
}
