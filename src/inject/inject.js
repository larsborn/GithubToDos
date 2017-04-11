chrome.extension.sendMessage({}, function (response) {
  const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);
      init();
    }
  }, 10);
});

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
      renderTodoSvg(),
      exists ? ' Remove ToDo' : ' Add ToDo'
    )
  );

  const h3 = element('h3', {
    className: 'discussion-sidebar-heading'
  }, 'ToDos');

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
  return element('div', { className: 'container page-content' },
    renderGroup('Todos', todos)
  );
}

function renderGroup(group, todos) {

  const list = todos.map(todo => {

    return element('li', { className: 'list-group-item js-notification js-navigation-item unread issue-notification', key: todo.url },
      element('span', { className: 'list-group-item-name css-truncate' },
        element('a', {
          className: 'css-truncate-target js-notification-target js-navigation-open list-group-item-link',
          href: todo.url,
          title: todo.title
        }, todo.title)),
      element('ul', { className: 'notification-actions' },
        element('li', { className: 'delete' },
          element('button', { className: 'btn-link delete-note tooltipped tooltipped-w', onClick: () => removeTodo(todo) },
            renderDoneSvg()
          )
        )
      )
    );

    /*
 <li class="list-group-item js-notification js-navigation-item unread issue-notification">
            <span class="list-group-item-name css-truncate">
              <svg aria-label="issues" class="octicon octicon-issue-closed type-icon type-icon-state-closed" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M7 10h2v2H7v-2zm2-6H7v5h2V4zm1.5 1.5l-1 1L12 9l4-4.5-1-1L12 7l-1.5-1.5zM8 13.7A5.71 5.71 0 0 1 2.3 8c0-3.14 2.56-5.7 5.7-5.7 1.83 0 3.45.88 4.5 2.2l.92-.92A6.947 6.947 0 0 0 8 1C4.14 1 1 4.14 1 8s3.14 7 7 7 7-3.14 7-7l-1.52 1.52c-.66 2.41-2.86 4.19-5.48 4.19v-.01z" /></svg>
              <a class="css-truncate-target js-notification-target js-navigation-open list-group-item-link" href="https://github.com/larsborn/GithubToDos/issues/1" title="Publish on Chrome Web Store">
                Publish on Chrome Web Store
      </a>
            </span>

            <ul class="notification-actions">
              <li class="delete">
                <!-- '"` --><!-- </textarea></xmp> --></option></form><form accept-charset="UTF-8" action="/larsborn/GithubToDos/notifications/mark?ids=205247728" class="js-delete-notification" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="Q7+OwUQlA6Ig/A5lzTljniFfre7nM9iXclEYSuCHwmOs7dlIc31dgpzTHqZbq09HvVXTsmoM+ks8Jcv/ClhpOg==" /></div>
          <button type="submit" aria-label="Mark as read" class="btn-link delete-note tooltipped tooltipped-w">
            <svg aria-hidden="true" class="octicon octicon-check" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5z" /></svg>
          </button>
        </form>    </li >

          <li class="mute ">
            <!-- '"` --><!-- </textarea></xmp > --></option ></form > <form accept-charset="UTF-8" action="/notifications/mute?id=205247728" class="js-mute-notification" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="lAgK8xlV0VcPt9+PPHeFKutmNIDjv24a8bUOMSY0Yi2k88RTsVbNi3uq6YmRx2uqCKGhkjdDY2elYpy3y9b4Ow==" /></div>
              <button type="submit" aria-label="Unsubscribe from this thread" class="btn-link mute-note tooltipped tooltipped-w">
                <svg aria-hidden="true" class="octicon octicon-mute" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M8 2.81v10.38c0 .67-.81 1-1.28.53L3 10H1c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h2l3.72-3.72C7.19 1.81 8 2.14 8 2.81zm7.53 3.22l-1.06-1.06-1.97 1.97-1.97-1.97-1.06 1.06L11.44 8 9.47 9.97l1.06 1.06 1.97-1.97 1.97 1.97 1.06-1.06L13.56 8l1.97-1.97z" /></svg>
              </button>
            </form>    </li >

              <li class="unmute">
                <!-- '"` --><!-- </textarea></xmp > --></option ></form > <form accept-charset="UTF-8" action="/notifications/unmute?id=205247728" class="js-unmute-notification" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="OcmCjwrD3A1SbTmf0IjRjsOQ65ijpZjwjSl4ln79G1o7BnFEuwZ0SMFrQ2r1bXAtoqzeO3wadS/mwKgPACb8qw==" /></div>
                  <button type="submit" aria-label="Subscribe to this thread" class="btn-link mute-note tooltipped tooltipped-w">
                    <svg aria-hidden="true" class="octicon octicon-unmute" height="16" version="1.1" viewBox="0 0 16 16" width="16"><path fill-rule="evenodd" d="M12 8.02c0 1.09-.45 2.09-1.17 2.83l-.67-.67c.55-.56.89-1.31.89-2.16 0-.85-.34-1.61-.89-2.16l.67-.67A3.99 3.99 0 0 1 12 8.02zM7.72 2.28L4 6H2c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h2l3.72 3.72c.47.47 1.28.14 1.28-.53V2.81c0-.67-.81-1-1.28-.53zm5.94.08l-.67.67a6.996 6.996 0 0 1 2.06 4.98c0 1.94-.78 3.7-2.06 4.98l.67.67A7.973 7.973 0 0 0 16 8c0-2.22-.89-4.22-2.34-5.66v.02zm-1.41 1.41l-.69.67a5.05 5.05 0 0 1 1.48 3.58c0 1.39-.56 2.66-1.48 3.56l.69.67A5.971 5.971 0 0 0 14 8.02c0-1.65-.67-3.16-1.75-4.25z" /></svg>
                  </button>
                </form>    </li >
                  <li class="age"><relative-time datetime="2017-04-11T17:51:58Z">Apr 11, 2017</relative-time></li>
                  <li class="tooltipped tooltipped-s" aria-label="larsborn"><div class="avatar-stack clearfix"><img alt="@larsborn" class="avatar from-avatar" height="39" src="https://avatars2.githubusercontent.com/u/1826897?v=3&amp;s=78" width="39" /></div></li>
    </ul >
  </li >

    */


  });

  return element(
    'div',
    {
      className: 'boxed-group flush'
    },
    element('h3', {}, group),
    element('ul', { className: 'boxed-group-inner list-group notifications' }, list)
  );

  /*

    <div class="boxed-group flush js-notifications-browser">
      <!-- '"` --><!-- </textarea></xmp > --></option ></form > <form accept-charset="UTF-8" action="/notifications/mark" class="boxed-group-action js-mark-visible-as-read" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="utf8" type="hidden" value="&#x2713;" /><input name="authenticity_token" type="hidden" value="Lk/cpXR3Zek6cwH56CrtsOrpFdyQuv2U2L727ESlBwyIOuxuRGzuN1q4tYn4fLZqIVVy++k2IlLHzpB+TzieMA==" /></div>            <input class="form-control" name="ids[]" type="hidden" value="205247728" />
        <p class="text-green">Marked <strong>1 notification</strong> as read.</p>

        <button type="submit" class="mark-all-as-read css-truncate tooltipped tooltipped-w" aria-label="Mark all GithubToDos notifications as read">
          <svg aria-hidden="true" class="octicon octicon-check" height="16" version="1.1" viewBox="0 0 12 16" width="12"><path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5z" /></svg>
        </button>
      </form> <h3>
        <a href="/larsborn/GithubToDos" class="css-truncate css-truncate-target notifications-repo-link" title="larsborn/GithubToDos">larsborn/GithubToDos</a>
      </h3>
        <ul class="boxed-group-inner list-group notifications">



          </ul >
        </div >

  */

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