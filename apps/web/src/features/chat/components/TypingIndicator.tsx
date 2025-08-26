import React from 'react';
import type { TypingUser } from '../../../hooks/useTyping';

const fmt = (arr: TypingUser[]) => {
  const names = arr.map(x => x.username);
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} đang nhập…`;
  if (names.length === 2) return `${names[0]} và ${names[1]} đang nhập…`;
  if (names.length === 3) return `${names[0]}, ${names[1]} và ${names[2]} đang nhập…`;
  return `${names[0]}, ${names[1]} và ${names.length - 2} người khác đang nhập…`;
};

export default function TypingIndicator({ typers }: { typers: TypingUser[] }) {
  if (!typers.length) return null;
  return (
    <div style={{ padding: '6px 10px', color: '#cfd3dc', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{fmt(typers)}</span>
      <span style={{ display: 'inline-block', width: 24 }}>
        <span style={{animation: 'blink 1s infinite'}}>•</span>
        <span style={{animation: 'blink 1s .2s infinite'}}>•</span>
        <span style={{animation: 'blink 1s .4s infinite'}}>•</span>
      </span>
      <style>{`@keyframes blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }`}</style>
    </div>
  );
}
