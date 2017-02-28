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

  let currentUrl = null;
  let state = 0;

  setInterval(() => {
    switch (state) {
      case 0:
        if (currentUrl !== location.href) {
          currentUrl = location.href;

          if (/\/(pull|issues)\/\d+$/.exec(currentUrl)) {
            state = 1;
          }
        }
        break;
      case 1:
        if (!document.querySelector('.button-toggle-todo')) {
          state = 2;
        }
        break;
      case 2:
        if (document.querySelector('#partial-users-participants')) {
          state = 3;
        }
        break;

      case 3:
        chrome.storage.sync.get('todos', items => {
          const todos = items.todos || [];

          renderButton(todos);
          renderNavIcon(todos);
        });

        state = 0;
        break;
    }
  }, 100);
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

    const p = document.createElement('p');
    p.classList.add('reason', 'text-small', 'text-gray');
    p.innerHTML = `
      By clicking this button, you can add the URL to your browser\'s local storage and access it through the ToDo list 
      icon in the navigation bar.
`;

    const outerDiv = document.createElement('div');
    outerDiv.classList.add('discussion-sidebar-item');
    outerDiv.classList.add('sidebar-notifications');
    outerDiv.appendChild(h3);
    outerDiv.appendChild(buttonDiv);
    outerDiv.appendChild(p);
    sidebar.insertBefore(outerDiv, document.getElementById('partial-users-participants'));
  }

  const url = location.href;
  const index = todos.indexOf(url);

  button.innerHTML = getSvg() + (index === -1 ? ' Add ToDo' : ' Remove ToDo');
}

function renderNavIcon(todos) {
  const nav = document.querySelector('.header-nav.user-nav');
  let layer = null;
  if (!nav) {
    return;
  }

  let navItem = document.querySelector('.header-nav-item-todo');

  if (!navItem) {
    navItem = document.createElement('li');
    navItem.classList.add('header-nav-item');
    navItem.classList.add('header-nav-item-todo');
    navItem.onclick = (e) => {
      if (layer) {
        layer.parentNode.removeChild(layer);
        layer = null;
      }
      else layer = renderLayer();
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


function renderLayer() {
  const header = document.querySelector('.header');
  const layer = document.createElement('div');
  let content = null;
  layer.style = {
    'position': 'absolute',
    'top': '54px',
    'backgroundColor': '#24292e',
    'zIndex': 999,
    'padding': '0.3em',
    'width': '100%'
  };
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (content) content.parentNode.removeChild(content);
    content = renderLayerList(changes['todos'].newValue);
    layer.appendChild(content);
  });
  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];
    if (todos.length === 0) {
      content = document.createElement('p');
      content.innerHTML = 'No ToDos.'
    }
    else {
      content = renderLayerList(todos);
    }
    layer.appendChild(content);
  });
  header.appendChild(layer);

  return layer;
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
  return ul;
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
