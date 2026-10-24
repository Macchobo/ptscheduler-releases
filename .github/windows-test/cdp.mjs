// 윈도우 시험: 앱 창에 붙어서 화면 글자·주소를 읽고 사진을 찍음
import { writeFileSync } from 'node:fs'
let pages = []
for (let i = 0; i < 30; i++) {
  try { pages = await (await fetch('http://127.0.0.1:9222/json')).json(); if (pages.some(p => p.type === 'page')) break } catch {}
  await new Promise(r => setTimeout(r, 2000))
}
const page = pages.find(p => p.type === 'page')
if (!page) { console.log('NO PAGE', JSON.stringify(pages)); process.exit(1) }
console.log('PAGE', page.title, page.url)
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise(r => ws.onopen = r)
let id = 0
const send = (method, params) => new Promise(res => { const my = ++id; ws.addEventListener('message', function h(e) { const m = JSON.parse(e.data); if (m.id === my) { ws.removeEventListener('message', h); res(m.result) } }); ws.send(JSON.stringify({ id: my, method, params })) })
await new Promise(r => setTimeout(r, 8000))
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value
console.log('TEXT', JSON.stringify(await ev("document.body.innerText.slice(0, 300)")))
console.log('DESKTOP', await ev("typeof window.ptDesktop + ' ' + (window.ptDesktop && window.ptDesktop.platform)"))
const shot = await send('Page.captureScreenshot', { format: 'png' })
writeFileSync('app.png', Buffer.from(shot.data, 'base64'))
ws.close()
