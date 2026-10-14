import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GlobalMotion from '@/components/motion/GlobalMotion';
import LiveChatWidget from '@/components/LiveChatWidget';

export default function SiteLayout({children}:{children:React.ReactNode}){
  return (
    <>
      <GlobalMotion/>
      <Header/>
      <main id="content">{children}</main>
      <Footer/>
      <LiveChatWidget/>
    </>
  );
}
