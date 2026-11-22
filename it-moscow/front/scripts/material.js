const get = id => document.getElementById(id);
const key = 'it-moscow.exchange.v1';
let board = {own: [], replies: []};
try {
  const saved = JSON.parse(localStorage.getItem(key));
  if (saved) board = {own: Array.isArray(saved.own) ? saved.own : [], replies: Array.isArray(saved.replies) ? saved.replies : []};
} catch { /* Read-only demo materials remain available without storage. */ }
const id = new URLSearchParams(location.search).get('id');
const item = [...board.own, ...seed].find(entry => entry.id === id && !entry.closed);
function save() {
  try { localStorage.setItem(key, JSON.stringify(board)); return true; } catch { return false; }
}
if (!item) {
  get('material-missing').hidden = false;
  document.title = 'Материал не найден · IT.МОСКВА';
} else {
  const request = item.type === 'request';
  const local = Boolean(item.own);
  const specs = [
    ['Тип', request ? 'Запрос' : 'Предложение'], ['Категория', item.category], ['Предмет', item.course],
    ['Формат', item.category === 'Книги' ? 'Бумажная книга' : 'Учебные материалы'],
    ['Условия', request ? 'Обсуждаются при отклике' : 'Обмен по договорённости'],
    ['Доступность', local ? 'Локальное объявление' : 'Демонстрационный пример']
  ];
  get('material').hidden = false;
  document.title = item.title + ' · IT.МОСКВА';
  for (const target of ['material-title', 'cover-title', 'crumb']) get(target).textContent = item.title;
  get('material-type').textContent = request ? 'Запрос' : 'Предложение';
  get('material-type').className = 'chip ' + item.type;
  get('material-category').textContent = item.category;
  get('cover-category').textContent = item.category.toLocaleUpperCase('ru');
  get('material-course').textContent = item.course;
  get('material-value').textContent = request ? 'Ищу материал' : 'Обмен по договорённости';
  get('material-terms').textContent = 'Стоимость и условия уточняются у автора. Оплата на сайте не предусмотрена.';
  get('material-description').textContent = item.description;
  get('material-use').textContent = 'Для самостоятельной подготовки по предмету «' + item.course + '» и поиска полезных источников для учебного проекта.';
  for (const [label, value] of specs) {
    const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = label; dd.textContent = value; row.append(dt, dd); get('material-specs').append(row);
  }
  const respond = get('material-respond');
  respond.hidden = local;
  get('material-close').hidden = !local;
  respond.disabled = board.replies.includes(item.id);
  if (respond.disabled) get('material-status').textContent = 'Отклик уже сохранён на этом устройстве.';
  respond.addEventListener('click', () => {
    if (board.replies.includes(item.id)) return;
    board.replies.push(item.id);
    const stored = save(); respond.disabled = true;
    get('material-status').textContent = stored ? 'Отклик сохранён на этом устройстве.' : 'Хранилище недоступно. Отклик сохранён только до перезагрузки страницы.';
  });
  get('material-close').addEventListener('click', () => {
    item.closed = true;
    if (save()) location.href = 'index.html#catalog';
    else { item.closed = false; get('material-status').textContent = 'Не удалось закрыть объявление. Проверь доступ к хранилищу браузера.'; }
  });
  get('material-share').addEventListener('click', async () => {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      get('material-status').textContent = 'Ссылка скопирована.' + (local ? ' Это объявление видно только в текущем браузере.' : '');
    } catch {
      get('share-fallback').hidden = false; get('share-url').value = url; get('share-url').focus(); get('share-url').select();
      get('material-status').textContent = 'Скопируй выделенную ссылку вручную.';
    }
  });
}
