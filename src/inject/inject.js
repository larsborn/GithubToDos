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

  const sidebar = document.querySelector('.discussion-sidebar-item.sidebar-notifications');

  const button = document.createElement('button');
  button.innerText = 'test';
  button.onclick = handleClick;

  sidebar.appendChild(button);
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
