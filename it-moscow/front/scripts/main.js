const storageKey = 'it-moscow.exchange.v1';
const labels = { offer: 'Предложение', request: 'Запрос' };
const icons = { 'Книги': '◫', 'Конспекты': '≡', 'Материалы': '⌘' };
const byId = id => document.getElementById(id);
function loadBoard() {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey));
    return { own: Array.isArray(value?.own) ? value.own : [], replies: Array.isArray(value?.replies) ? value.replies : [] };
  } catch {
    return { own: [], replies: [] };
  }
}
const board = loadBoard();
function saveBoard() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(board));
    return true;
  } catch {
    return false;
  }
}
const editor = byId('editor');
const details = byId('details');
const form = byId('publish-form');
const cards = byId('cards');
const tabs = [...document.querySelectorAll('[data-type]')];
let selectedType = '';
let selectedItem = null;
const normalize = text => text.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
function element(tag, text, cls) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  return node;
}
function showResponse(item, stored = true) {
  const replied = board.replies.includes(item.id);
  byId('respond').disabled = replied;
  byId('detail-note').textContent = replied
    ? (stored ? 'Отклик сохранён на этом устройстве.' : 'Отклик сохранён до закрытия страницы.')
    : '';
}
function openDetails(item) {
  selectedItem = item;
  byId('detail-title').textContent = item.title;
  byId('detail-meta').textContent = labels[item.type] + ' · ' + item.category + ' · ' + item.course;
  byId('detail-description').textContent = item.description;
  byId('close-listing').hidden = !item.own;
  byId('respond').hidden = Boolean(item.own);
  showResponse(item);
  details.showModal();
}
function makeCard(item) {
  const card = element('article', '', 'card');
  card.dataset.kind = item.type;
  const badges = element('div', '', 'badges');
  badges.append(element('span', labels[item.type], 'chip ' + item.type), element('span', item.category, 'chip'));
  const more = element('a', 'Подробнее', 'button small');
  more.href = 'material.html?id=' + encodeURIComponent(item.id);
  more.setAttribute('aria-label', 'Подробнее: ' + item.title);
  card.append(element('span', icons[item.category], 'card-icon'), element('h3', item.title),
    element('p', item.course, 'meta'), element('p', item.description), badges, element('p', ''), more);
  return card;
}
function openEditor() {
  form.reset();
  clearValidation(form);
  document.querySelector('[data-form-note]').textContent = '';
  editor.showModal();
}
function render() {
  const search = normalize(byId('search').value);
  const category = byId('category').value;
  const found = [...board.own, ...seed].filter(item => !item.closed
    && (!selectedType || item.type === selectedType) && (!category || item.category === category)
    && normalize(item.title + ' ' + item.course).includes(search));
  byId('result').textContent = 'Найдено объявлений: ' + found.length;
  cards.replaceChildren(...found.map(makeCard));
  if (!found.length) {
    const empty = element('div', '', 'empty');
    const button = element('button', 'Оставить запрос', 'button primary');
    button.type = 'button';
    button.addEventListener('click', openEditor);
    empty.append(element('p', 'Ничего не найдено. Попробуй другой запрос или добавь объявление.'), button);
    cards.append(empty);
  }
}
function chooseType(type) {
  selectedType = type;
  tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.type === type)));
}
byId('search').addEventListener('input', render);
byId('category').addEventListener('change', render);
tabs.forEach(tab => tab.addEventListener('click', () => { chooseType(tab.dataset.type); render(); }));
document.querySelectorAll('[data-publish]').forEach(button => button.addEventListener('click', openEditor));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validateForm(form)) return;
  const values = new FormData(form);
  const title = values.get('title').trim();
  const course = values.get('course').trim();
  const description = values.get('description').trim();
  if (!title || !course || !description) {
    document.querySelector('[data-form-note]').textContent = 'Заполни название, предмет и описание.';
    return;
  }
  board.own.unshift({ id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2), type: values.get('type'), category: values.get('category'), title, course, description, own: true });
  const stored = saveBoard();
  editor.close();
  chooseType('');
  byId('search').value = '';
  byId('category').value = '';
  render();
  if (!stored) byId('result').textContent += '. Новая запись доступна до закрытия страницы.';
  byId('catalog-title').scrollIntoView({ block: 'start' });
});
byId('respond').addEventListener('click', () => {
  if (!selectedItem || selectedItem.own || board.replies.includes(selectedItem.id)) return;
  board.replies.push(selectedItem.id);
  showResponse(selectedItem, saveBoard());
});
byId('close-listing').addEventListener('click', () => {
  if (!selectedItem?.own) return;
  selectedItem.closed = true;
  const stored = saveBoard();
  details.close();
  render();
  if (!stored) byId('result').textContent += '. Изменение доступно до закрытия страницы.';
});
render();

// Shared validation: trim before checking, inline errors and focus on first invalid field.
const rules = {
  'publish-form': {type: {options: ['request','offer']}, category: {options: Object.keys(icons)}, title: {min: 1,max: 80}, course: {min: 1,max: 55}, description: {min: 1,max: 320}},
  'feedback-form': {name: {min: 2,max: 50}, message: {min: 10,max: 500}},
  'registration-form': {studentName: {min: 2,max: 50}, email: {max: 254,email: true}, group: {min: 2,max: 20}, password: {min: 8,max: 128,password: true,raw: true}, confirmPassword: {max: 128,raw: true,confirm: true}}
};
function validationMessage(value, rule) {
  const text = rule.raw ? value : value.trim();
  if (!text) return 'Заполни это поле.';
  if (rule.options && !rule.options.includes(text)) return 'Выбери значение из списка.';
  if (rule.min && text.length < rule.min) return 'Введи не менее ' + rule.min + ' символов.';
  if (rule.max && text.length > rule.max) return 'Не более ' + rule.max + ' символов.';
  if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Введи email в формате student@example.com.';
  if (rule.password && (!/\p{L}/u.test(text) || !/[0-9]/.test(text))) return 'Добавь хотя бы одну букву и одну цифру.';
  return '';
}
function validateField(field, rule) {
  let message = validationMessage(field.value, rule);
  if (!message && rule.confirm && field.value !== field.form.elements.namedItem('password').value) message = 'Пароли не совпадают.';
  const error = byId(field.getAttribute('aria-describedby'));
  error.textContent = message;
  field.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}
function validateForm(target) {
  let first;
  for (const [name, rule] of Object.entries(rules[target.id])) {
    const field = target.elements.namedItem(name);
    if (!validateField(field, rule) && !first) first = field;
  }
  if (first) first.focus();
  return !first;
}
function clearValidation(target) {
  target.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  target.querySelectorAll('.field-error').forEach(error => { error.textContent = ''; });
}
for (const [id, fields] of Object.entries(rules)) {
  const target = byId(id);
  for (const [name, rule] of Object.entries(fields)) {
    const field = target.elements.namedItem(name);
    const error = element('span', '', 'field-error');
    error.id = id + '-' + name + '-error';
    error.setAttribute('aria-live','polite');
    field.setAttribute('aria-describedby',error.id);
    field.after(error);
    field.addEventListener('blur', () => validateField(field,rule));
    field.addEventListener('input', () => {
      if (field.hasAttribute('aria-invalid')) validateField(field,rule);
    });
    field.addEventListener('change', () => validateField(field,rule));
  }
}
const feedback = byId('feedback-form');
feedback.addEventListener('submit', event => {
  event.preventDefault();
  const note = document.querySelector('[data-feedback-note]');
  note.textContent = '';
  if (!validateForm(feedback)) return;
  const values = new FormData(feedback);
  const entry = {kind: 'question',name: values.get('name').trim(),message: values.get('message').trim(),createdAt: new Date().toISOString()};
  try {
    const old = JSON.parse(localStorage.getItem('it-moscow.feedback.v1') || '[]');
    const entries = Array.isArray(old) ? old : [];
    entries.push(entry);
    localStorage.setItem('it-moscow.feedback.v1',JSON.stringify(entries));
    feedback.reset();
    clearValidation(feedback);
    note.textContent = 'Сообщение сохранено на этом устройстве. Спасибо!';
    note.classList.add('success');
  } catch {
    note.classList.remove('success');
    note.textContent = 'Не удалось сохранить сообщение. Проверь настройки хранилища браузера и попробуй снова. Текст остался в форме.';
  }
});

// Demo registration saves a profile only: passwords never enter browser storage.
const registration = byId('registration');
const registrationForm = byId('registration-form');
const profileKey = 'it-moscow.profile.v1';
let demoProfile = null;
try {
  const saved = JSON.parse(localStorage.getItem(profileKey));
  if (saved && typeof saved.name === 'string' && typeof saved.email === 'string' && typeof saved.group === 'string') demoProfile = saved;
} catch { /* An unavailable store must not prevent using the rest of the page. */ }
function showDemoProfile(justCreated = false) {
  registrationForm.hidden = true;
  byId('registration-success').hidden = false;
  byId('registration-title').textContent = 'Мой демопрофиль';
  byId('registration-status').textContent = justCreated ? 'Регистрация завершена. Демопрофиль сохранён на этом устройстве.' : 'Демопрофиль сохранён на этом устройстве.';
  byId('profile-name').textContent = demoProfile.name;
  byId('profile-email').textContent = demoProfile.email;
  byId('profile-group').textContent = demoProfile.group;
  byId('open-registration').textContent = 'Мой профиль';
}
function showRegistrationForm() {
  registrationForm.reset();
  clearValidation(registrationForm);
  registrationForm.hidden = false;
  byId('registration-success').hidden = true;
  byId('registration-title').textContent = 'Регистрация';
  document.querySelector('[data-registration-note]').textContent = '';
}
byId('open-registration').addEventListener('click', () => {
  if (demoProfile) showDemoProfile(); else showRegistrationForm();
  registration.showModal();
  registration.scrollTop = 0;
});
byId('another-profile').addEventListener('click', () => {
  showRegistrationForm();
  registrationForm.elements.namedItem('studentName').focus();
});
const passwordField = registrationForm.elements.namedItem('password');
passwordField.addEventListener('input', () => {
  const confirm = registrationForm.elements.namedItem('confirmPassword');
  if (confirm.hasAttribute('aria-invalid')) validateField(confirm,rules['registration-form'].confirmPassword);
});
registration.addEventListener('close', () => {
  passwordField.value = '';
  registrationForm.elements.namedItem('confirmPassword').value = '';
});
registrationForm.addEventListener('submit', event => {
  event.preventDefault();
  const note = document.querySelector('[data-registration-note]');
  note.textContent = '';
  if (!validateForm(registrationForm)) return;
  const values = new FormData(registrationForm);
  const profile = {name: values.get('studentName').trim(), email: values.get('email').trim().toLowerCase(), group: values.get('group').trim(), createdAt: new Date().toISOString()};
  try {
    localStorage.setItem(profileKey,JSON.stringify(profile));
    demoProfile = profile;
    registrationForm.reset();
    clearValidation(registrationForm);
    showDemoProfile(true);
    byId('registration-status').setAttribute('tabindex','-1');
    byId('registration-status').focus({preventScroll: true});
    registration.scrollTop = 0;
  } catch {
    note.textContent = 'Не удалось сохранить демопрофиль. Проверь настройки хранилища браузера и попробуй снова.';
  }
});
if (demoProfile) byId('open-registration').textContent = 'Мой профиль';
