chrome.extension.sendMessage({}, function (response) {
  const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);
      init();
    }
  }, 10);
});

function init() {
  chrome.storage.onChanged.addListener(changes => {
    render(changes['todos'].newValue || []);
  });

  chrome.storage.sync.get('todos', items => {
    render(items.todos || []);
  });

  const target = document.querySelector('#js-repo-pjax-container');

  if (!target) {
    return;
  }

  const observer = new MutationObserver(function (mutations) {
    chrome.storage.sync.get('todos', items => {
      render(items.todos || []);
    });
  });

  observer.observe(target, {childList: true});
}

function render(todos) {
  renderButton(todos);
  renderNavIcon(todos);
}

function renderButton(todos) {
  const sidebar = document.querySelector('#partial-discussion-sidebar');

  if (!sidebar) {
    return;
  }

  let button = document.querySelector('.button-toggle-todo');

  if (!button) {
    const buttonDiv = document.createElement('div');
    buttonDiv.classList.add('thread-subscription-status', 'thread-todo-status');

    button = document.createElement('button');
    button.classList.add('btn', 'btn-sm', 'button-toggle-todo');
    button.onclick = toggleTodo;

    buttonDiv.appendChild(button);

    const h3 = document.createElement('h3');
    h3.classList.add('discussion-sidebar-heading');
    h3.innerHTML = 'ToDos';

    const outerDiv = document.createElement('div');
    outerDiv.classList.add('discussion-sidebar-item');
    outerDiv.classList.add('sidebar-notifications');
    outerDiv.appendChild(h3);
    outerDiv.appendChild(buttonDiv);
    sidebar.insertBefore(outerDiv, document.getElementById('partial-users-participants'));
  }

  const url = location.href;
  const index = todos.indexOf(url);

  button.innerHTML = getSvg() + (index === -1 ? ' Add ToDo' : ' Remove ToDo');
}

function renderNavIcon(todos) {
  const nav = document.querySelector('.header-nav.user-nav');

  if (!nav) {
    return;
  }

  let navItem = document.querySelector('.header-nav-item-todo');

  if (!navItem) {
    navItem = document.createElement('li');
    navItem.classList.add('header-nav-item');
    navItem.classList.add('header-nav-item-todo');
    navItem.onclick = e => {
      renderPage();
      e.preventDefault();
    };

    nav.insertBefore(navItem, nav.childNodes[0]);
  }

  navItem.innerHTML = `
    <a href="#todos" 
      class="header-nav-link notification-indicator tooltipped tooltipped-s js-notification-indicator">
        ${todos.length > 0 ? '<span class="mail-status unread"></span>' : ''}
        ${getSvg()}
    </a>
  `;
}

function renderPage() {
  const container = document.querySelector('#js-repo-pjax-container, #js-pjax-container');

  chrome.storage.onChanged.addListener(function (changes) {
    container.innerHTML = '';
    layer.appendChild(renderPageContent(changes['todos'].newValue));
  });

  chrome.storage.sync.get('todos', items => {
    container.innerHTML = '';
    container.appendChild(renderPageContent(items.todos || []));
  });
}

function renderPageContent(todos) {

  const wrapper = document.createElement('div');
  wrapper.classList.add('container', 'page-content');

  const ul = document.createElement('ul');
  todos.map(function (todo) {
    const li = document.createElement('li');
    const removeBtn = document.createElement('button');
    removeBtn.onclick = () => {
      chrome.storage.sync.get('todos', items => {
        const todos = items.todos || [];
        const pos = todos.indexOf(todo);
        if (pos != -1) {
          todos.splice(pos, 1);
          chrome.storage.sync.set({
            'todos': todos
          });
        }
      });
    };
    removeBtn.classList.add('btn');
    removeBtn.classList.add('btn-sm');
    removeBtn.innerHTML = 'Done';

    const a = document.createElement('a');
    a.style.paddingLeft = '0.5em';
    a.href = todo;
    a.innerHTML = todo.replace('https://github.com/', '');

    li.appendChild(removeBtn);
    li.appendChild(a);
    li.style.padding = '0.2em';
    ul.appendChild(li)
  });

  wrapper.appendChild(ul);

  return wrapper;
}

function toggleTodo() {
  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];
    const url = location.href;
    const index = todos.indexOf(url);

    if (index === -1) {
      todos.push(url);
    } else {
      todos.splice(index, 1);
    }

    chrome.storage.sync.set({
      'todos': todos
    });
  });
}

function getSvg() {
  return `
    <svg class="octicon octicon-checklist" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
        <path fill-rule="evenodd" d="M16 8.5l-6 6-3-3L8.5 10l1.5 1.5L14.5 7 16 8.5zM5.7 12.2l.8.8H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h7c.55 0 1 .45 1 1v6.5l-.8-.8c-.39-.39-1.03-.39-1.42 0L5.7 10.8a.996.996 0 0 0 0 1.41v-.01zM4 4h5V3H4v1zm0 2h5V5H4v1zm0 2h3V7H4v1zM3 9H2v1h1V9zm0-2H2v1h1V7zm0-2H2v1h1V5zm0-2H2v1h1V3z"></path>
     </svg>
  `;
}
