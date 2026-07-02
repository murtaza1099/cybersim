export const ATTACK_MODULES = [
  { id: 'phishing', name: 'Phishing Email', icon: '📧', color: 'cyan' },
  { id: 'vishing', name: 'Vishing Call', icon: '📞', color: 'green' },
  { id: 'quidProQuo', name: 'Quid Pro Quo', icon: '🎁', color: 'amber' },
  { id: 'tailgating', name: 'Tailgating', icon: '🚪', color: 'red' },
  { id: 'usbDrop', name: 'USB Drop', icon: '💾', color: 'purple' },
  { id: 'password', name: 'Password Attack', icon: '🔐', color: 'cyan' },
  { id: 'data', name: 'Data Handling', icon: '📄', color: 'green' },
];

export const BADGES = [
  { id: 'phishing_spotter', name: 'Phishing Spotter', icon: '🎣', module: 'phishing', desc: 'Identified and reported a phishing email' },
  { id: 'call_screener', name: 'Call Screener', icon: '📞', module: 'vishing', desc: 'Handled a vishing attempt correctly' },
  { id: 'deal_refuser', name: 'Deal Refuser', icon: '🎁', module: 'quidProQuo', desc: 'Rejected a quid pro quo offer' },
  { id: 'access_guardian', name: 'Access Guardian', icon: '🚪', module: 'tailgating', desc: 'Enforced physical access policy' },
  { id: 'usb_warrior', name: 'USB Warrior', icon: '💾', module: 'usbDrop', desc: 'Handled malicious media correctly' },
  { id: 'password_keeper', name: 'Password Keeper', icon: '🔐', module: 'password', desc: 'Demonstrated workstation hygiene' },
  { id: 'data_protector', name: 'Data Protector', icon: '📄', module: 'data', desc: 'Secured sensitive information' },
];
