// app.js
import { login, logout, isLoggedIn, getUser, fetchBalance, placeBet, connectWS } from './api.js';

const DICE_FACES = ['','⚀','⚁','⚂','⚃','⚄','⚅'];

// --- Init ---
window.addEventListener('DOMContentLoaded', async () => {
  if (isLoggedIn()) {
    showApp();
    const { balance } = await fetchBalance();
    updateBal(balance);
    connectWS(handleWSMessage);
  } else {
    showLogin();
  }
});

// --- Auth UI ---
window.submitLogin = async function () {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const err  = document.getElementById('loginErr');
  if (!user || !pass) return (err.textContent = 'Fill in all fields');
  err.textContent = 'Logging in...';
  const res = await login(user, pass);
  if (res.ok) {
    showApp();
    updateBal(res.balance);
    connectWS(handleWSMessage);
  } else {
    err.textContent = res.error;
  }
};

window.doLogout = function () {
  logout();
  showLogin();
};

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display   = 'none';
}

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display   = 'block';
  document.getElementById('userLabel').textContent = getUser();
}

// --- Balance ---
function updateBal(amount) {
  document.getElementById('bal').textContent = amount;
}

// --- Pending state (disable buttons during bet) ---
function setPending(cardId, on) {
  document.querySelectorAll(`#${cardId} button`).forEach(b => b.disabled = on);
}

// --- Coin Flip ---
window.pickSide = async function (choice) {
  const amount = getBet('coinBet');
  if (!amount) return setResult('coinResult', 'Invalid bet', '');
  setPending('coinCard', true);
  const res = await placeBet({ game: 'coin', amount, choice: { amount, choice } });
  setPending('coinCard', false);
  if (!res.ok) return setResult('coinResult', res.error, '');
  document.getElementById('coin').textContent = res.outcome === 'heads' ? '🟡' : '⚪';
  updateBal(res.balance);
  setResult('coinResult',
    `${res.outcome.toUpperCase()} — ${res.win ? `+$${amount} WIN!` : `-$${amount} LOSE`}`,
    res.win ? 'win' : 'lose'
  );
  pushFeed('coin', res.win, amount);
};

// --- Dice Roll ---
window.rollDice = async function () {
  const amount = getBet('diceBet');
  const guess  = parseInt(document.getElementById('diceGuess').value);
  if (!amount || guess < 1 || guess > 6) return setResult('diceResult', 'Invalid bet/guess', '');
  setPending('diceCard', true);
  const res = await placeBet({ game: 'dice', amount, choice: { amount, guess } });
  setPending('diceCard', false);
  if (!res.ok) return setResult('diceResult', res.error, '');
  document.getElementById('diceDisplay').textContent = DICE_FACES[res.outcome];
  updateBal(res.balance);
  setResult('diceResult',
    `Rolled ${res.outcome} — ${res.win ? `+$${amount*5} WIN! (5x)` : `-$${amount} LOSE`}`,
    res.win ? 'win' : 'lose'
  );
  pushFeed('dice', res.win, amount);
};

// --- Slots ---
window.spinSlots = async function () {
  const amount = getBet('slotBet');
  if (!amount) return setResult('slotResult', 'Invalid bet', '');
  setPending('slotCard', true);
  const res = await placeBet({ game: 'slots', amount, choice: { amount } });
  setPending('slotCard', false);
  if (!res.ok) return setResult('slotResult', res.error, '');
  ['r1','r2','r3'].forEach((id, i) => document.getElementById(id).textContent = res.outcome[i]);
  updateBal(res.balance);
  const gain = Math.abs(res.delta);
  setResult('slotResult',
    res.win ? (res.delta >= amount*5 ? `JACKPOT! +$${gain}` : `Two of a kind! +$${gain}`) : `No match. -$${amount}`,
    res.win ? 'win' : 'lose'
  );
  pushFeed('slots', res.win, amount);
};

// --- Live Feed ---
// TODO: Replace pushFeed calls with incoming WS events from server
function pushFeed(game, win, amount) {
  const feed = document.getElementById('feed');
  const icons = { coin:'🪙', dice:'🎲', slots:'🎰' };
  const item = document.createElement('div');
  item.className = `feed-item ${win ? 'win' : 'lose'}`;
  item.textContent = `${icons[game]} ${getUser()} ${win ? `won $${amount}` : `lost $${amount}`}`;
  feed.prepend(item);
  if (feed.children.length > 10) feed.lastChild.remove();
}

function handleWSMessage(msg) {
  // TODO: handle incoming realtime events
  // msg types: 'balance_update', 'feed_event', 'system'
  if (msg.type === 'balance_update') updateBal(msg.balance);
  if (msg.type === 'feed_event') pushFeed(msg.game, msg.win, msg.amount);
}

// --- Helpers ---
function getBet(inputId) {
  const b = parseInt(document.getElementById(inputId).value) || 0;
  const bal = parseInt(document.getElementById('bal').textContent);
  return (b > 0 && b <= bal) ? b : null;
}

function setResult(id, msg, cls) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = 'result ' + (cls || '');
}
