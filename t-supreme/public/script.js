let token = null;

function login() {
  const pseudo = document.getElementById("pseudo").value;
  const password = document.getElementById("password").value;
  fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({pseudo, password})
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      token = data.token;
      document.getElementById("login-screen").style.display = "none";
      document.getElementById("chat-screen").style.display = "block";
      getMessages();
      setInterval(getMessages, 3000);
    } else {
      document.getElementById("login-error").innerText = data.message;
    }
  });
}

function sendMessage() {
  const msg = document.getElementById("message").value;
  fetch('/api/message', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({token, message: msg})
  }).then(() => {
    document.getElementById("message").value = "";
    getMessages();
  });
}

function getMessages() {
  fetch('/api/messages')
    .then(res => res.json())
    .then(data => {
      const log = document.getElementById("chat-log");
      log.innerHTML = data.messages.map(m => `<div><b>${m.from}</b>: ${m.text}</div>`).join("");
    });
}