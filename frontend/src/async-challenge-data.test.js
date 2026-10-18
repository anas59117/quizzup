import { receiveAsyncState } from './async-challenge-data';
const question = (round=0) => ({round,question:'Which city?',answers:['Paris','Rome','Oslo','Lima'],remainingMs:10000,opensInMs:2050});
test('deadline includes reading and entrance; resume cannot extend it', () => {
 const first=receiveAsyncState(null,{status:'playing',question:question()},1000);
 expect(first.opensAt).toBe(3050);expect(first.deadline).toBe(13050);
 const resumed=receiveAsyncState(first,{status:'playing',question:{...question(),opensInMs:0,remainingMs:7000}},6050);
 expect(resumed.deadline).toBe(13050);expect(resumed.opensAt).toBe(3050);
});
test('late prior rounds and completed rollback are ignored', () => {
 const current=receiveAsyncState(null,{status:'playing',question:question(3)},1000);
 expect(receiveAsyncState(current,{status:'playing',question:question(2)},2000)).toBe(current);
 const done={status:'completed',round:6};expect(receiveAsyncState(done,{status:'waiting',round:6},2000)).toBe(done);
});
test('feedback retains previous answers and replay does not restart feedback duration', () => {
 const first=receiveAsyncState(null,{status:'playing',question:question()},1000);
 const next=receiveAsyncState(first,{status:'playing',question:question(1),feedback:{round:0,correct:false,correctIndex:2}},5000);
 expect(next.feedbackQuestion.answers[2]).toBe('Oslo');expect(next.feedbackUntil).toBe(5900);expect(next.deadline).toBe(17050);
 const replay=receiveAsyncState(next,{...next},5300);expect(replay.feedbackUntil).toBe(5900);
});
