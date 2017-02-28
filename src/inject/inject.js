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

  chrome.storage.onChanged.addListener(changes => {
    const todos = changes['todos'].newValue || [];

    renderButton(todos);
    renderNavIcon(todos);
  });

  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];

    renderButton(todos);
    renderNavIcon(todos);
  });
}

function renderButton(todos) {
  const sidebar = document.querySelector('.discussion-sidebar-item.sidebar-notifications');

  if (!sidebar) {
    return;
  }

  let button = document.querySelector('.button-toggle-todo');

  if (!button) {
    const div = document.createElement('div');
    div.classList.add('thread-subscription-status');
    div.classList.add('thread-todo-status');
    div.style.paddingTop = '1em';

    button = document.createElement('button');
    button.classList.add('btn', 'btn-sm', 'button-toggle-todo');
    button.onclick = toggleTodo;

    div.appendChild(button);
    sidebar.appendChild(div);
  }

  const url = location.href;
  const index = todos.indexOf(url);

  if (index === -1) {
    button.innerHTML = getSvg() + ' Add ToDo';
  } else {
    button.innerHTML = getSvg() + ' Remove ToDo';
  }
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
    navItem.onclick = toggleLayer;
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


function renderLayer() {
  const header = document.querySelector('.header');
  const layer = document.createElement('div');
  let ul = null;
  layer.id = 'GithubToDo';
  layer.style.position = 'absolute';
  layer.style.top = '54px';
  layer.style.backgroundColor = '#24292e';
  layer.style.zIndex = 999;
  layer.style.right = 0;
  layer.style.width = '100%';
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (ul) ul.parentNode.removeChild(ul);
    ul = renderLayerList(changes['todos'].newValue);
    layer.appendChild(ul);
  });
  chrome.storage.sync.get('todos', items => {
    ul = renderLayerList(items.todos || []);
    layer.appendChild(ul);
  });
  header.appendChild(layer);
}

function renderLayerList(todos) {
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
    removeBtn.innerHTML = 'Done';
    const a = document.createElement('a');
    a.innerHTML = a.href = todo;
    li.appendChild(a);
    li.appendChild(removeBtn);
    ul.appendChild(li)
  });
  return ul;
}

function toggleLayer() {
  let layer = document.getElementById('GithubToDo');
  if (layer) {
    layer.parentNode.removeChild(layer);
  }
  else {
    renderLayer();
  }
}

function toggleTodo() {
  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];
    const url = location.href;
    console.log(items);
    console.log(todos);

    const index = todos.indexOf(url);

    if (index === -1) {
      todos.push(url);
    } else {
      todos.splice(index, 1);
    }

    chrome.storage.sync.set({
      'todos': todos
    });

    console.log(todos);
  });
}

function getSvg() {
  return `
    <svg class="octicon octicon-checklist" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
        <path fill-rule="evenodd" d="M16 8.5l-6 6-3-3L8.5 10l1.5 1.5L14.5 7 16 8.5zM5.7 12.2l.8.8H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h7c.55 0 1 .45 1 1v6.5l-.8-.8c-.39-.39-1.03-.39-1.42 0L5.7 10.8a.996.996 0 0 0 0 1.41v-.01zM4 4h5V3H4v1zm0 2h5V5H4v1zm0 2h3V7H4v1zM3 9H2v1h1V9zm0-2H2v1h1V7zm0-2H2v1h1V5zm0-2H2v1h1V3z"></path>
     </svg>
  `;
}
