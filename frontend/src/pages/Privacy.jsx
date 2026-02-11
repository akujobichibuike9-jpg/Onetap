import { useNavigate } from 'react-router-dom';
import { C, OneTapLogo } from '../App';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'TERMS OF SERVICE',
      content: `Account Security: 
You are responsible for safeguarding your password. OneTap By Chivera uses hashing to securely store your password, but you MUST not share your login details as we would not be held liable for whatever might ensue afterwards.
Futhermore, accounts found to be involved in malicious or fraudulent activity will be BLOCKED without prior notice.`
    },
    {
      title: 'How We Use Your Information',
      content: `We use the information we collect to:
• Provide, maintain, and improve our services
• Process transactions and send related information
• Detect, investigate, and prevent fraudulent transactions
• Comply with legal obligations`
    },
    {
      title: 'Information Sharing',
      content: `We do not sell your personal information. We may share information with:
• Service providers who assist in our operations
• Regulatory authorities when required by law
• And no one else.`
    },
    {
      title: 'Offer of Service',
      content: `Terms And Conditions:

DELIVERY: We aim for instant delivery of service. However network delays from telecom and other providers are outside our control, reach out to PAYENGINE AI by Chivera for any Inconvinience faced.


USER ERROR: We cannot and do not refund purchases made to the wrong phone or smart card number, please double check before sending.


KYC VERIFICATON: By using our KYC services you authorize us to verify your details against approved databases.


LIMITATION OF LIABILITY: OneTap By Chivera provides a platform for convinience, we are not liable for any loss resulting from service downtime, bank failures during Monnify transfers or unauthorised access to your device`
    },
    {
      title: 'Your Rights',
      content: `Under Nigerian Data Protection Regulation (NDPR), you reserve the right to:
• Access your personal data
• Rectify inaccurate data
• Request deletion of your data
• Delete your account`
    },
    {
      title: 'Data Retention',
      content: `We retain your information for a while to:
• Provide our services
• Comply with legal obligations
• Resolve disputes
• Enforce our agreements

`
    },
    {
      title: 'Contact Us',
      content: `If you have questions about this Privacy Policy contact us at:

Email: chiblinks3@gmail.com
Address: Felling England`
    },

{
      title: 'Creators Note',
      content: `If you can read this, then i did IT!!, it gives me immense joy that you are able to sit from the comfort of wherever you are to use this piece of software with ease to perform whatever task running independently of me!! At 3am when i am fast asleep and you need sub, its there with or without me. And that, is a every creators joy. Thank you and enjoy OneTap By Chivera.
`
    }
    
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ width: 44, height: 44, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSec, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>Privacy Policy</h1>
            <p style={{ color: C.textMuted, fontSize: 13 }}>Last updated: January 2026</p>
          </div>
          <OneTapLogo size={40} />
        </div>

        {/* Intro */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.7 }}>
            OneTap ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
          </p>
        </div>

        {/* Sections */}
        {sections.map((section, i) => (
          <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 12 }}>{section.title}</h2>
            <p style={{ color: C.textSec, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <OneTapLogo size={40} />
          <p style={{ color: C.textMuted, fontSize: 12, marginTop: 12 }}>© 2026 Chivera Technologies. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
