import Script from "next/script";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-6">
      <div className="text-center text-sm">
        Copyright © 2026 - STR Market Map  
        – All Rights Reserved.  
        – Developed in cooperation with <span className="font-semibold">ADME.Labs</span>
      </div>
      <Script id="brevo-conversations" strategy="afterInteractive">
          {`
            (function(d, w, c) {
              w.BrevoConversationsID = '6929a626b6361a7c78029c04';
              w[c] = w[c] || function() {
                (w[c].q = w[c].q || []).push(arguments);
              };
              var s = d.createElement('script');
              s.async = true;
              s.src = 'https://conversations-widget.brevo.com/brevo-conversations.js';
              if (d.head) d.head.appendChild(s);
            })(document, window, 'BrevoConversations');
          `}
        </Script>
    </footer>
  );
}