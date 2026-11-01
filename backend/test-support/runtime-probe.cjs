// Isolated load-test instrumentation. Never loaded by the production server.
const { monitorEventLoopDelay, performance } = require('node:perf_hooks');
const delay = monitorEventLoopDelay({ resolution: 10 });
delay.enable();
let lastCpu = process.cpuUsage();
let lastTime = performance.now();
process.on('message', message => {
  if (message?.type !== 'load_ready') return;
  delay.reset(); lastCpu = process.cpuUsage(); lastTime = performance.now();
  if (process.connected) process.send({ type: 'load_ready' });
});
setInterval(() => {
  const now = performance.now();
  const cpu = process.cpuUsage();
  if (process.connected) process.send({ type: 'load_sample', rssMB: process.memoryUsage().rss / 1048576,
    loopP99Ms: delay.percentile(99) / 1e6, loopMaxMs: delay.max / 1e6,
    cpuCores: ((cpu.user - lastCpu.user) + (cpu.system - lastCpu.system)) / ((now - lastTime) * 1000) });
  delay.reset(); lastCpu = cpu; lastTime = now;
}, 1000).unref();
