// direction: ARENA SHOWCASE — dark stage, illustrated identities, crisp warm light.
// rules: static catalogue, finite previews, shared avatars, no decorative rank frames.
// signature: each cosmetic plays around the same character on a miniature duel stage.
import React from 'react';
import { PlayerAvatar } from './PlayerAvatar';

const PARTICLES = [[29, 44, 8], [54, 24, 5], [202, 37, 7], [224, 74, 4], [18, 150, 5], [212, 174, 9], [45, 190, 6], [173, 211, 4]];
const SPARK = 'M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2Z';

function EntryLayer({ kind, uid, foreground = false }) {
  const warm = `url(#${uid}-warm)`, cool = `url(#${uid}-cool)`, smoke = `url(#${uid}-smoke)`;
  return <svg className={`qa-effect qa-effect--${kind} ${foreground ? 'qa-effect--front' : ''}`} viewBox="0 0 240 240" fill="none" aria-hidden="true">
    {!foreground && <defs>
      <linearGradient id={`${uid}-warm`} x1="120" y1="210" x2="120" y2="35" gradientUnits="userSpaceOnUse"><stop stopColor="#ff543d" /><stop offset=".5" stopColor="#ffb541" /><stop offset="1" stopColor="#fff3af" /></linearGradient>
      <linearGradient id={`${uid}-cool`} x1="30" y1="50" x2="205" y2="190" gradientUnits="userSpaceOnUse"><stop stopColor="#e0ffff" /><stop offset=".48" stopColor="#67ddf5" /><stop offset="1" stopColor="#337daf" /></linearGradient>
      <radialGradient id={`${uid}-smoke`}><stop stopColor="#bbecf5" stopOpacity=".68" /><stop offset="1" stopColor="#5fa5c6" stopOpacity=".1" /></radialGradient>
    </defs>}
    {kind === 'lightning' && (foreground ? <g className="qa-flash" stroke="#fff3bd" strokeWidth="2" strokeLinecap="round"><path d="m26 181 19-9-5 13 14-3M203 164l-17 5 6 7-12 4" /><path d="M76 209h88" opacity=".5" /></g> : <g className="qa-bolts">
      <path d="m81 18-40 67 23-6-30 62 58-80-26 6 27-43Z" fill={warm} /><path d="m183 31-31 46 20-3-17 46 41-58-23 4 25-41Z" fill={warm} />
      <path d="m53 164-16 22 12-3-9 26 30-40-13 3 8-18Z" fill="#ffc14e" /><path d="m198 131 13 25-9-2 14 31-30-35 10 1-11-25Z" fill="#ffba45" />
      <path d="m78 36-25 41 20-5-17 32M183 46l-18 26 18-3-14 28" stroke="#fffbe3" strokeWidth="2" />
    </g>)}
    {kind === 'smoke' && <g className={foreground ? 'qa-smoke-front' : 'qa-smoke-clouds'} fill={smoke} stroke="#9ae6f2" strokeOpacity=".2">
      {(foreground ? [[42,181,28],[77,199,33],[169,198,35],[204,178,26]] : [[39,129,35],[52,80,26],[78,49,24],[164,49,26],[201,92,35],[209,139,30],[117,186,66]]).map(([x,y,r],i) => <circle key={i} cx={x} cy={y} r={r} style={{ '--particle': i }} />)}
      {foreground && <path d="M17 199q25-15 53 0t52 0 54 0 46-2" stroke="#bdebf4" strokeWidth="2" fill="none" />}
    </g>}
    {kind === 'pixels' && <g className="qa-pixel-cloud">{(foreground ? [[37,163,12],[186,161,12],[58,188,7],[164,193,8]] : [[42,56,13],[65,34,8],[174,30,10],[195,60,14],[23,106,9],[201,114,8],[38,139,6],[190,143,13],[86,20,5],[144,19,6]]).map(([x,y,s],i) => <g key={i} className="qa-pixel" style={{ '--particle': i }}><rect x={x} y={y} width={s} height={s} rx="1" fill={i % 3 === 0 ? '#ffe283' : i % 3 === 1 ? '#ff87a9' : '#82e8ef'} /><path d={`M${x+2} ${y+s-2}v-${s-4}h${s-4}`} stroke="#fff" strokeOpacity=".55" /></g>)}</g>}
    {kind === 'portal' && (foreground ? <g className="qa-portal-floor"><ellipse cx="120" cy="196" rx="77" ry="13" stroke="#76eaf0" strokeWidth="2" /><path d="M51 195c17 15 123 16 140-1" stroke="#fff8d4" strokeWidth="3" /></g> : <g className="qa-portal-ring">
      <ellipse cx="120" cy="117" rx="80" ry="91" stroke="#ff8760" strokeOpacity=".18" strokeWidth="18" /><ellipse cx="120" cy="117" rx="76" ry="88" stroke="#ffaa76" strokeWidth="4" />
      <ellipse cx="120" cy="117" rx="68" ry="80" stroke="#78e8ee" strokeWidth="2" strokeDasharray="37 9 6 13" /><path d="M54 73c12-26 35-41 65-41M186 137c-5 23-18 42-33 52" stroke="#fff3c6" strokeWidth="3" strokeLinecap="round" />
      {[[-82,0],[83,0],[0,-93],[0,93]].map(([x,y],i) => <path key={i} d={SPARK} transform={`translate(${120+x} ${117+y}) scale(.7)`} fill="#fff4d8" />)}
    </g>)}
    {kind === 'flames' && (foreground ? <g className="qa-embers" fill="#ffd473">{PARTICLES.slice(0,5).map(([x,y],i) => <path key={i} d="M0-5Q6 2 0 6Q-5 2 0-5Z" transform={`translate(${x} ${y+25})`} style={{ '--particle': i }} />)}</g> : <g className="qa-fire">
      <path d="M29 198C3 176 22 151 28 137c0 21 13 17 15 34-1-41 23-53 20-87 29 27 23 42 34 47 10-40 22-49 22-93 32 30 16 59 32 78 20-17 14-38 24-57 30 43 7 55 24 82 5-18 11-18 17-35 19 46 24 74-7 97Z" fill={warm} />
      <path d="M53 195c-17-27 10-44 11-66 11 14 5 25 19 33 5-27 22-43 27-59 19 15 10 35 23 47 11-11 20-19 24-36 20 24 12 40 29 47 5-8 8-18 8-26 22 26 24 44 8 62Z" fill="#ffe185" /><path d="M94 195q-13-23 17-43c-1 21 13 20 17 0 27 24 29 32 21 44Z" fill="#fff4bd" />
    </g>)}
    {kind === 'glitch' && <g className={foreground ? 'qa-glitch-front' : 'qa-glitch-lines'}>{(foreground ? [[30,107,66,3],[162,137,45,4],[63,172,90,2]] : [[29,43,71,3],[147,61,57,5],[21,94,34,4],[181,114,43,3],[40,151,39,5],[162,178,56,4],[72,202,99,2]]).map(([x,y,w,h],i) => <g key={i} style={{ '--particle': i }}><rect x={x} y={y} width={w} height={h} fill="#79ecf1" /><rect x={x+8} y={y+4} width={w*.65} height="2" fill="#ff7597" opacity=".85" /></g>)}{!foreground && <path d="M31 73V48h15M209 169v24h-16" stroke="#c9faff" strokeWidth="2" />}</g>}
    {kind === 'tornado' && (foreground ? <g className="qa-wind-front" stroke={cool} strokeWidth="3" strokeLinecap="round"><path d="M24 147c35 33 155 36 191 4M47 179c29 24 118 26 153 2M77 206c22 8 58 8 79 0" /><path d="M32 162c17 8 31 12 55 14" strokeWidth="1" /></g> : <g className="qa-wind" stroke={cool} strokeWidth="3" strokeLinecap="round"><path d="M36 46c21-18 128-20 165-2s-8 30-23 33M28 83c30-23 176-18 188 3s-4 20-28 27M20 119c15-14 31-19 46-19M176 104c25 3 41 13 44 24M42 157c-29-22-28-32-19-36M197 150c13-7 22-16 22-23" /><path d="M55 59c28-12 81-14 110-8M33 97c7-5 20-10 31-11" strokeWidth="1" /><path d={SPARK} transform="translate(208 56) scale(.6)" fill="#cdf9ff" stroke="none" /></g>)}
    {kind === 'meteor' && (foreground ? <g className="qa-impact" stroke="#ffc871" strokeLinecap="round"><ellipse cx="123" cy="200" rx="82" ry="14" strokeWidth="2" /><path d="m27 183 15 5m165-14-13 13M91 216l-4 7m71-9 5 6" strokeWidth="3" /></g> : <g className="qa-comet">
      <path d="M12 12 119 62 61 112Z" fill="#fd6841" opacity=".35" /><path d="M16 16 99 57 61 95Z" fill={warm} /><path d="m26 26 67 40-23 20Z" fill="#fff2a8" />
      <circle cx="85" cy="84" r="24" fill={warm} /><path d="m73 70 15-4 11 12-4 16-18 4-8-14Z" fill="#a84831" /><path d="m76 70 8 8 14-1m-14 1-7 20m7-20 13 13" stroke="#ffd293" strokeWidth="2" />
      <path d="m17 58 19 13m100-33 8 10m-10 48 12 4" stroke="#ffcd83" strokeWidth="2" strokeLinecap="round" />
    </g>)}
  </svg>;
}

function Reaction({ kind, uid }) {
  const face = ['sweat', 'cool', 'angry', 'laugh', 'shock'].includes(kind);
  return <svg className={`qa-reaction qa-reaction--${kind}`} viewBox="0 0 128 128" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id={`${uid}-sticker`} x1="30" y1="12" x2="91" y2="120" gradientUnits="userSpaceOnUse"><stop stopColor={kind === 'angry' ? '#ffb289' : '#ffed9c'} /><stop offset="1" stopColor={kind === 'angry' ? '#ee6750' : '#f6ad3e'} /></linearGradient><linearGradient id={`${uid}-heart`} x1="40" y1="22" x2="91" y2="108" gradientUnits="userSpaceOnUse"><stop stopColor="#ffb4bf" /><stop offset=".4" stopColor="#ff6483" /><stop offset="1" stopColor="#cf345c" /></linearGradient></defs>
    {face && <><circle cx="64" cy="68" r="48" fill={`url(#${uid}-sticker)`} stroke="#fff3d5" strokeWidth="4" /><path d="M27 49c6-13 16-19 30-21" stroke="#fff9d9" strokeWidth="4" opacity=".8" /><ellipse cx="31" cy="81" rx="8" ry="4" fill="#ee8761" opacity=".4" /><ellipse cx="97" cy="81" rx="8" ry="4" fill="#ee8761" opacity=".4" /></>}
    {kind === 'clap' && <><g className="qa-clap-hand qa-clap-hand--back" transform="translate(20 -8) rotate(18 64 70)"><path d="M31 98 23 69c-2-7 6-10 10-3l8 12-9-45c-1-7 8-10 11-2l9 32-3-39c0-8 10-8 11 0l5 37 5-34c1-8 11-6 10 2l-2 34 9-20c4-7 12-3 9 4l-10 42c-8 27-38 29-55 9Z" fill="#eda555" stroke="#fff0d0" strokeWidth="3" /></g><g className="qa-clap-hand"><path d="M28 110 15 83c-4-9 6-13 11-6l9 10-10-43c-2-8 8-11 11-3l11 33-5-45c-1-8 9-9 11-1l8 39 2-36c0-9 10-9 11-1l1 38 7-24c2-8 13-5 11 3l-6 45c-4 24-37 37-59 18Z" fill={`url(#${uid}-sticker)`} stroke="#fff3d5" strokeWidth="4" /><path d="m44 92 8-7m12-4 10-1" stroke="#c47a30" strokeWidth="3" /></g><g stroke="#fff3cc" strokeWidth="4"><path d="m9 25 9 9m91-20-5 11m17 10-11 4" /></g></>}
    {kind === 'sweat' && <><path d="m32 50 15-6m34 0 14 6" stroke="#734c38" strokeWidth="4" /><ellipse cx="44" cy="65" rx="4" ry="7" fill="#503b34" /><ellipse cx="84" cy="65" rx="4" ry="7" fill="#503b34" /><path d="M47 94q16-9 33 0" stroke="#734c38" strokeWidth="4" /><path className="qa-droplet" d="M96 7c-10 18-17 22-15 34 2 15 24 16 29 3 5-12-7-25-14-37Z" fill="#76e6f7" stroke="#dcfcff" strokeWidth="3" /><path d="m92 31-3 8" stroke="#fff" strokeWidth="3" /></>}
    {kind === 'cool' && <><path d="M19 54h38l7 7 7-7h38l-6 22c-6 12-29 11-34-1l-5-11-5 11c-5 12-28 13-34 1Z" fill="#202636" stroke="#fff8d9" strokeWidth="3" /><path d="m32 62 14 0-13 10m46-10h14L80 72" stroke="#81dbea" strokeWidth="3" opacity=".8" /><path d="M49 94q18 10 32-3" stroke="#654531" strokeWidth="4" /><path d={SPARK} transform="translate(112 29) scale(1.3)" fill="#fff3c6" /></>}
    {kind === 'heart' && <><path d="M64 113 20 73C-13 38 32 1 64 32 96 1 141 38 108 73Z" fill={`url(#${uid}-heart)`} stroke="#ffe1e5" strokeWidth="4" /><path d="M28 46c-2-12 13-18 23-11" stroke="#fff1f1" strokeWidth="6" /><path d="m91 80-18 17" stroke="#b72a51" strokeWidth="4" opacity=".5" /><path d={SPARK} transform="translate(111 15)" fill="#fff4d9" /><path d={SPARK} transform="translate(10 96) scale(.7)" fill="#ff9aac" /></>}
    {kind === 'angry' && <><path d="m31 49 19 9m28 0 19-9" stroke="#69362d" strokeWidth="5" /><ellipse cx="44" cy="71" rx="4" ry="7" fill="#69362d" /><ellipse cx="84" cy="71" rx="4" ry="7" fill="#69362d" /><path d="M46 97q18-16 36 0" stroke="#69362d" strokeWidth="5" /><path d="m94 16-3 8-8-3m22-5 3 8 8-3m-22 20-3-8-8 3m22 5 3-8 8 3" stroke="#ff735e" strokeWidth="4" /><path d="M5 85q-5-10 3-14m112 14q9-10 1-14" stroke="#f8d9bb" strokeWidth="3" /></>}
    {kind === 'laugh' && <><path d="m33 56 13-8-13-7m62 15-13-8 13-7" stroke="#644332" strokeWidth="5" /><path d="M35 72h58c-4 28-15 35-29 35S39 100 35 72Z" fill="#663d35" stroke="#563532" strokeWidth="2" /><path d="M39 74h50l-3 8H42Z" fill="#fff9e8" /><path d="M47 100q17-15 34 0" fill="#ff8e98" /><path d="M19 55C2 70 7 88 19 81c9-6 3-15 0-26m90 0c17 15 12 33 0 26-9-6-3-15 0-26Z" fill="#78dcf0" stroke="#d9faff" strokeWidth="2" /></>}
    {kind === 'shock' && <><path d="m32 41 16-5m32 0 16 5" stroke="#7d5739" strokeWidth="3" /><ellipse cx="44" cy="62" rx="12" ry="16" fill="#fffdf0" /><ellipse cx="84" cy="62" rx="12" ry="16" fill="#fffdf0" /><circle cx="44" cy="65" r="5" fill="#4e3d34" /><circle cx="84" cy="65" r="5" fill="#4e3d34" /><ellipse cx="64" cy="95" rx="11" ry="15" fill="#674432" /><path d="M16 22 8 12m48-4-3-8m57 24 11-10" stroke="#fff3c9" strokeWidth="4" /></>}
    {kind === 'thumbsup' && <><path d="M40 105V62L58 28c6-10 17-6 16 5l-5 24h27c13 0 17 8 13 20l-9 26c-2 7-8 11-15 11H53Z" fill={`url(#${uid}-sticker)`} stroke="#fff2d3" strokeWidth="4" /><path d="M69 74h32M69 87h28M68 100h22" stroke="#bd7a34" strokeWidth="2" /><rect x="15" y="61" width="28" height="54" rx="7" fill="#4ca8b9" stroke="#dcffff" strokeWidth="4" /><circle cx="30" cy="102" r="3" fill="#dcffff" /><path d={SPARK} transform="translate(106 26) scale(1.2)" fill="#fff2c5" /></>}
  </svg>;
}

function Celebration({ kind }) {
  return <svg className={`qa-celebration qa-celebration--${kind}`} viewBox="0 0 240 240" aria-hidden="true" fill="none">
    {kind === 'throne' && <g stroke="#ffe6a0" strokeWidth="2"><path d="M59 189V87l15-17 12 8 15-22 19 18 19-18 15 22 12-8 15 17v102Z" fill="#b35a38" /><path d="M72 182V95l48-15 48 15v87Z" fill="#823e38" /><path d="M52 173h136v25H52Z" fill="#ecad56" /><path d="M58 198v15m124-15v15" strokeWidth="8" /></g>}
    {kind === 'fireworks' && <g className="qa-fireworks">{[[49,60,'#ffb16e'],[191,65,'#7fe5ec'],[180,152,'#ff93ae']].map(([x,y,color],i) => <g key={i} transform={`translate(${x} ${y})`} stroke={color} strokeLinecap="round" style={{ '--particle': i }}>{Array.from({length:8},(_,n) => <path key={n} d="M0-15v-14M0-35v-3" transform={`rotate(${n*45})`} strokeWidth={n%2 ? 2 : 3} />)}<circle r="4" fill="#fff1c8" stroke="none" /></g>)}</g>}
    {kind === 'disco' && <g className="qa-disco"><path d="M180 0v22" stroke="#c5eef3" strokeWidth="2" /><circle cx="180" cy="52" r="29" fill="#acdce3" stroke="#e5ffff" strokeWidth="2" /><path d="M151 52h58M156 38h48M156 65h48M180 23v58M167 27q-15 25 0 50m26-50q15 25 0 50" stroke="#487d98" strokeWidth="2" /><path d="m150 82-32 86m75-86 28 76" stroke="#8cdeee" strokeWidth="15" opacity=".12" /><path d={SPARK} transform="translate(210 30)" fill="#fff4ce" /></g>}
    {kind === 'micdrop' && <g className="qa-microphone" transform="rotate(28 187 143)"><rect x="173" y="86" width="29" height="47" rx="14" fill="#c4e1ec" stroke="#f0fbff" strokeWidth="3" /><path d="M179 97h17m-17 8h17m-17 8h17" stroke="#587181" strokeWidth="2" /><path d="M181 133h14v51h-14Z" fill="#3e4555" stroke="#bacdd7" strokeWidth="2" /></g>}
    {kind === 'rocket' && <g className="qa-rocket" transform="rotate(16 190 135)"><path d="m178 185 10 38 11-38" fill="#ffb655" /><path d="m172 160-13 29 16-6m27-23 13 29-16-6" fill="#eb604e" stroke="#ffb291" strokeWidth="2" /><path d="M188 88c-23 27-21 54-13 95h26c8-41 10-68-13-95Z" fill="#f8e9d8" stroke="#fff5df" strokeWidth="2" /><path d="m188 88-13 26h26Z" fill="#ef6d52" /><circle cx="188" cy="137" r="9" fill="#5dbccf" stroke="#4c7288" strokeWidth="3" /></g>}
    {kind === 'spotlight' && <g><path d="m38 0 18 0 111 212H4Z" fill="#fff2b7" opacity=".14" /><path d="m186 0 17 0 32 212H87Z" fill="#fff2b7" opacity=".14" /><path d="M40 1h14m133 0h14" stroke="#fff1bd" strokeWidth="5" /></g>}
    {kind === 'dance' && <g fill="#ffe29a"><path d="M39 68V42l20-5v26M39 48l20-5" stroke="#ffe29a" strokeWidth="3" /><ellipse cx="34" cy="69" rx="7" ry="5" /><ellipse cx="54" cy="64" rx="7" ry="5" /><path d="M194 101V71l15 5" stroke="#9aebf0" strokeWidth="3" /><ellipse cx="188" cy="101" rx="7" ry="5" fill="#9aebf0" /></g>}
    {PARTICLES.slice(0,6).map(([x,y,s],i) => <path className="qa-ribbon" key={i} d={i%2 ? 'M0-4Q7 0 0 5' : SPARK} transform={`translate(${x} ${y}) scale(${s/9})`} fill={i%2 ? 'none' : '#fff0bc'} stroke={i%2 ? '#ff8d87' : 'none'} strokeWidth="3" style={{ '--particle': i }} />)}
  </svg>;
}

export function ShopArt({ item, avatar = 'robot', animated = false }) {
  const uid = `qa-${React.useId().replace(/:/g, '')}`;
  const character = item.category === 'avatars' ? item.art : avatar;
  return <div className={`shop-v4-art qa-art qa-art--${item.category} qa-art--${item.id || item.art} shop-v4-tone-${item.tone} ${animated ? 'qa-art--playing' : ''}`} aria-hidden="true">
    <div className="qa-stage-light" /><div className="qa-stage-floor" />
    {item.category === 'entries' && <EntryLayer kind={item.id} uid={uid} />}
    {item.category === 'celebrations' && ['throne', 'spotlight', 'fireworks', 'disco', 'dance'].includes(item.id) && <Celebration kind={item.id} />}
    <div className="qa-character"><PlayerAvatar avatar={character} /></div>
    {item.category === 'entries' && <EntryLayer kind={item.id} uid={uid} foreground />}
    {item.category === 'reactions' && <Reaction kind={item.id} uid={uid} />}
    {item.category === 'celebrations' && ['micdrop', 'rocket'].includes(item.id) && <Celebration kind={item.id} />}
    <div className="qa-stage-rim" />
  </div>;
}
