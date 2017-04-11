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
    display(changes.todos.newValue || []);
  });

  chrome.storage.sync.get('todos', items => {
    display(items.todos || []);
  });

  const target = document.querySelector('#js-repo-pjax-container');

  if (!target) {
    return;
  }

  const observer = new MutationObserver(function (mutations) {
    chrome.storage.sync.get('todos', items => {
      display(items.todos || []);
    });
  });

  observer.observe(target, { childList: true });
}

function display(todos) {
  displayButton(todos);
  displayNavIcon(todos);
}

function displayButton(todos) {
  const sidebar = document.querySelector('#partial-discussion-sidebar');

  if (!sidebar) {
    return;
  }

  let mount = document.querySelector('#github-todos-sidebar');

  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'github-todos-sidebar';

    sidebar.insertBefore(mount, document.getElementById('partial-users-participants'));
  }

  const url = location.href;
  const exists = todos.some(t => t.url === url);

  render(renderButton(exists), mount);
}

function renderButton(exists) {
  const button = element('div', {
    className: 'thread-subscription-status thread-todo-status'
  },
    element('button', {
      className: 'btn btn-sm button-toggle-todo',
      onClick: () => {
        toggleTodo(extractTodoInformation());
      }
    },
      renderSvg(),
      exists ? ' Remove ToDo' : ' Add ToDo'
    )
  );

  const h3 = element('h3', {
    className: 'discussion-sidebar-heading'
  }, 'ToDos')

  return element('div', {
    className: 'discussion-sidebar-item sidebar-notifications'
  },
    h3,
    button
  )
}

function displayNavIcon(todos) {
  const nav = document.querySelector('.header-nav.user-nav');

  if (!nav) {
    return;
  }

  let navItem = document.querySelector('.header-nav-item-todo');

  if (!navItem) {
    navItem = document.createElement('li');
    navItem.classList.add('header-nav-item', 'header-nav-item-todo');

    nav.insertBefore(navItem, nav.childNodes[0]);
  }

  render(renderNavIcon(todos), navItem);
}

function renderNavIcon(todos) {
  return element('a', {
    href: '#todos',
    className: 'header-nav-link notification-indicator tooltipped tooltipped-s js-notification-indicator',
    onClick: e => {
      renderPage();
      e.preventDefault();
    }
  },
    todos.length > 0 ? element('span', { className: 'mail-status unread' }) : null,
    renderSvg()
  );
}

function renderPage() {
  const container = document.querySelector('#js-repo-pjax-container, #js-pjax-container');

  chrome.storage.onChanged.addListener(function (changes) {
    render(renderPageContent(changes.todos.newValue || []), container);
  });

  chrome.storage.sync.get('todos', items => {
    render(renderPageContent(items.todos || []), container);
  });
}

function renderPageContent(todos) {

  const list = todos.map(function (todo) {

    const button = element(
      'button',
      {
        className: 'btn btn-sm',
        onClick: () => {
          removeTodo(todo);
        }
      },
      'Done'
    );

    const link = element(
      'a',
      {
        style: {
          paddingLeft: '0.5em',
          href: todo.url
        }
      },
      todo.url.replace('https://github.com/', '')
    );

    return element(
      'li',
      {
        key: todo.url,
        style: { padding: '0.2em' }
      },
      link,
      button
    );
  });

  return element('div', { className: 'container page-content' },
    element(
      'ul',
      {},
      list
    )
  );
}

function renderSvg() {
  return element('svg', {
    className: 'octicon octicon-checklist',
    viewBox: '0 0 16 16',
    version: '1.1',
    width: 16,
    height: 16
  },
    element('path', {
      fillRule: 'evenodd',
      d: 'M16 8.5l-6 6-3-3L8.5 10l1.5 1.5L14.5 7 16 8.5zM5.7 12.2l.8.8H2c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1h7c.55 0 1 .45 1 1v6.5l-.8-.8c-.39-.39-1.03-.39-1.42 0L5.7 10.8a.996.996 0 0 0 0 1.41v-.01zM4 4h5V3H4v1zm0 2h5V5H4v1zm0 2h3V7H4v1zM3 9H2v1h1V9zm0-2H2v1h1V7zm0-2H2v1h1V5zm0-2H2v1h1V3z'
    })
  );
}

/* Todo Commands */
function toggleTodo(todo) {
  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];
    const index = todos.findIndex(t => t.url === todo.url);

    if (index === -1) {
      todos.push(todo);
    } else {
      todos.splice(index, 1);
    }

    chrome.storage.sync.set({
      'todos': todos
    });
  });
}

function addTodo(todo) {
  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];
    todos.push(todo);

    chrome.storage.sync.set({
      'todos': todos
    });
  });
}

function removeTodo(todo) {
  chrome.storage.sync.get('todos', items => {
    const todos = items.todos || [];

    const index = todos.findIndex(t => t.url === todo.url);

    if (index === -1) {
      return;
    }

    todos.splice(index, 1);

    chrome.storage.sync.set({
      'todos': todos
    });
  });
}

/* extract informations */

function extractTodoInformation() {
  return {
    createdAt: getCurrentTimestamp(),
    type: extractType(),
    title: extractTitle(),
    project: extractProject(),
    participants: extractParticipants(),
    url: location.href
  };
}

function extractTitle() {
  const titles = document.getElementsByClassName('js-issue-title');
  return titles.length === 1 ? titles[0].textContent.trim() : null;
}

function extractProject() {
  return location.href.replace('https://github.com/', '').split('/').slice(0, 2).join('/');
}

function extractType() {
  const selectedMenuItemText = document.querySelector('.reponav .selected').textContent.trim();
  if (selectedMenuItemText.indexOf('Issues') !== -1) return 'Issue';
  if (selectedMenuItemText.indexOf('Pull requests') !== -1) return 'Pull Request';
  return null
}

function extractParticipants() {
  return Array.prototype.map.call(document.getElementsByClassName('participant-avatar'), elem => {
    return {
      href: elem.href,
      src: elem.children[0].src,
    };
  });
}

function getCurrentTimestamp() {
  const now = new Date();
  return now.getFullYear()
    + "-" + ("0" + (now.getMonth() + 1)).slice(-2)
    + "-" + ("0" + now.getDate()).slice(-2)
    + " " + ("0" + now.getHours()).slice(-2)
    + ":" + ("0" + now.getMinutes()).slice(-2)
    + ":" + ("0" + now.getSeconds()).slice(-2);
}

/* helper functions */

function element(type, props, ...children) {
  return React.createElement(type, props, ...children)
}

function render(element, mountNode) {
  return ReactDOM.render(element, mountNode);
}