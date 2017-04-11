chrome.extension.sendMessage({}, function (response) {
  const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);
      init();
    }
  }, 10);
});

const TYPE_ISSUE = 'issue';
const TYPE_PULL_REQUEST = 'pull_request'

function init() {
  if (location.href.replace('https://github.com', '') === '/t0do') {
    displayPage();
  }

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

  const url = getCurrentUrl();
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
      renderTodoSvg(),
      exists ? ' Remove ToDo' : ' Add ToDo'
    )
  );

  const h3 = element('h3', { className: 'discussion-sidebar-heading' }, 'ToDos');

  return element('div', { className: 'discussion-sidebar-item sidebar-notifications' },
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
      'aria-label': 'ToDos',
      onClick: e => {
        history.pushState({}, 'GithubToDos', '/t0do');
        displayPage();
        e.preventDefault();
      }
    },
    todos.length > 0 ? element('span', {className: 'mail-status unread'}) : null,
    renderTodoSvg()
  );
}

function displayPage() {
  const container = document.querySelector('#js-repo-pjax-container, #js-pjax-container');

  chrome.storage.onChanged.addListener(function (changes) {
    render(renderPageContent(changes.todos.newValue || []), container);
  });

  chrome.storage.sync.get('todos', items => {
    render(renderPageContent(items.todos || []), container);
  });
}

function renderPageContent(todos) {

  if (todos.length === 0) {
    return element('div', { style: { padding: '50px' } },
      element('div', { className: 'blankslate blankslate-spacious blankslate-large' },
        renderTodoSvg(),
        element('h3', {}, 'No todos'),
        element('p', {}, 'Good work!')
      )
    );
  }


  const groups = groupBy(todos, 'project');

  return element('div', { className: 'container page-content' },
    Object.keys(groups).map(group => renderGroup(group, groups[group]))
  );
}

function renderGroup(group, todos) {

  const list = todos.map(todo => {

    return element('li', { className: 'list-group-item js-notification js-navigation-item unread issue-notification', key: todo.url },
      element('span', { className: 'list-group-item-name css-truncate' },
        todo.type == TYPE_ISSUE ? renderIssueSvg() : renderPullRequestSvg(),
        element('a', {
          className: 'css-truncate-target js-notification-target js-navigation-open list-group-item-link',
          href: todo.url,
          title: todo.title
        }, todo.title)),
      element('ul', { className: 'notification-actions' },
        element('li', { className: 'delete' },
          element('button', { className: 'btn-link delete-note tooltipped tooltipped-w', 'aria-label': 'Check of a todo', onClick: () => removeTodo(todo) },
            renderDoneSvg()
          )
        )
      )
    );
  });

  return element(
    'div',
    {
      key: group,
      className: 'boxed-group flush'
    },
    element('h3', {}, 
      element('a', {href: '/' + group}, group)
    ),
    element('ul', { className: 'boxed-group-inner list-group notifications' }, list)
  );
}

function renderTodoSvg() {
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

function renderDoneSvg() {
  return element('svg', {
    className: 'octicon octicon-check',
    viewBox: '0 0 12 16',
    version: '1.1',
    width: 12,
    height: 16
  },
    element('path', {
      fillRule: 'evenodd',
      d: 'M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5z'
    })
  );
}

function renderIssueSvg() {
  return element('svg', {
    className: 'octicon octicon-issue-opened type-icon type-icon-state-open',
    viewBox: '0 0 14 16',
    version: '1.1',
    width: 14,
    height: 16
  },
    element('path', {
      fillRule: 'evenodd',
      d: 'M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z'
    })
  );
}

function renderPullRequestSvg() {
  return element('svg', {
    className: 'octicon octicon-git-pull-request type-icon type-icon-state-open',
    viewBox: '0 0 12 16',
    version: '1.1',
    width: 12,
    height: 16
  },
    element('path', {
      fillRule: 'evenodd',
      d: 'M11 11.28V5c-.03-.78-.34-1.47-.94-2.06C9.46 2.35 8.78 2.03 8 2H7V0L4 3l3 3V4h1c.27.02.48.11.69.31.21.2.3.42.31.69v6.28A1.993 1.993 0 0 0 10 15a1.993 1.993 0 0 0 1-3.72zm-1 2.92c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zM4 3c0-1.11-.89-2-2-2a1.993 1.993 0 0 0-1 3.72v6.56A1.993 1.993 0 0 0 2 15a1.993 1.993 0 0 0 1-3.72V4.72c.59-.34 1-.98 1-1.72zm-.8 10c0 .66-.55 1.2-1.2 1.2-.65 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zz'
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

/* extract information */

function extractTodoInformation() {
  return {
    createdAt: getCurrentTimestamp(),
    type: extractType(),
    title: extractTitle(),
    project: extractProject(),
    participants: extractParticipants(),
    url: getCurrentUrl()
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
  if (selectedMenuItemText.indexOf('Issues') !== -1) return TYPE_ISSUE;
  if (selectedMenuItemText.indexOf('Pull requests') !== -1) return TYPE_PULL_REQUEST;
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
    + '-' + ('0' + (now.getMonth() + 1)).slice(-2)
    + '-' + ('0' + now.getDate()).slice(-2)
    + ' ' + ('0' + now.getHours()).slice(-2)
    + ':' + ('0' + now.getMinutes()).slice(-2)
    + ':' + ('0' + now.getSeconds()).slice(-2);
}

/* helper functions */

function element(type, props, ...children) {
  return React.createElement(type, props, ...children)
}

function render(element, mountNode) {
  return ReactDOM.render(element, mountNode);
}

function getCurrentUrl() {
  return location.href.split('#')[0];
}

function groupBy(xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};