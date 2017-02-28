chrome.extension.sendMessage({}, function (response) {
  const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);
      init();
    }
  }, 10);
});

function init() {
  console.log('init');
  renderButton();
  renderNavIcon();
}

function renderButton() {
  const sidebar = document.querySelector('.discussion-sidebar-item.sidebar-notifications');

  if (!sidebar) {
    return;
  }

  const div = document.createElement('div');
  div.className = 'thread-subscription-status';
  div.style.paddingTop = '1em';

  const svg = document.createElement('svg');
  svg.className = 'octicon octicon-checklist';

  const button = document.createElement('button');
  button.className = 'btn btn-sm';

  button.innerHTML = getSvg() + ' Add ToDo';
  button.onclick = handleClick;

  div.appendChild(button);
  sidebar.appendChild(div);
}

function renderNavIcon() {
  const nav = document.querySelector('.header-nav.user-nav');

  if (!nav) {
    return;
  }

  chrome.storage.sync.get('todos', items => {
    const html = `
      <a href="/notifications" aria-label="You have unread notifications" class="header-nav-link notification-indicator tooltipped tooltipped-s js-socket-channel js-notification-indicator" data-channel="tenant:1:notification-changed:470138" data-ga-click="Header, go to notifications, icon:unread" data-hotkey="g n">
          ${'<span class="mail-status unread"></span>'}
          ${getSvg()}
      </a>
    `;

    const navItem = document.createElement('li');
    navItem.classList.add('header-nav-item');
    navItem.innerHTML = html;
    navItem.onclick = handleClick;

    nav.insertBefore(navItem, nav.childNodes[0]);
  });
}

function getSvg() {
  return `
    <svg class="octicon octicon-checklist" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
        <path fill-rule="evenodd" d="M16 8.5l-6 6-3-3L8.5 10l1.5 1.5L14.5 7 16 8.5zM5.7 12.2l.8.8H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h7c.55 0 1 .45 1 1v6.5l-.8-.8c-.39-.39-1.03-.39-1.42 0L5.7 10.8a.996.996 0 0 0 0 1.41v-.01zM4 4h5V3H4v1zm0 2h5V5H4v1zm0 2h3V7H4v1zM3 9H2v1h1V9zm0-2H2v1h1V7zm0-2H2v1h1V5zm0-2H2v1h1V3z"></path>
     </svg>
  `;
}

function handleClick() {
  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];
    const url = location.href;
    console.log(items);
    console.log(todos);

    if (todos.indexOf(url) === -1) {
      todos.push(url);

      chrome.storage.sync.set({
        'todos': todos
      });
    }

    console.log(todos);
  });
}
