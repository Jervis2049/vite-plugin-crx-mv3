chrome.devtools.panels.create(
  'DevPanel',
  null,
  'panel.html',
  function (panel) {}
)

chrome.devtools.panels.elements.createSidebarPane(
  'Sidebar',
  function (sidebar) {
    sidebar.setPage('sidebar.html')
  }
)
