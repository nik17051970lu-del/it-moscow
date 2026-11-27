const express = require('express');
const path = require('node:path');

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', project: 'Стол заказов проектов · IT.МОСКВА' });
  });

  // Publish only the website, never repository files or documentation.
  app.use(express.static(path.join(__dirname, 'it-moscow', 'front'), {
    dotfiles: 'deny',
    index: 'index.html'
  }));

  app.use((_req, res) => {
    res.status(404).type('html').send('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Страница не найдена</title><h1>Страница не найдена</h1><p>Проверь адрес или вернись в каталог.</p><a href="/">Открыть каталог</a></html>');
  });

  app.use((error, _req, res, _next) => {
    const status = error.status >= 400 && error.status < 500 ? error.status : 500;
    res.status(status).json({ error: status === 500 ? 'Ошибка сервера' : 'Запрос не может быть обработан' });
  });
  return app;
}

module.exports = { createApp };
