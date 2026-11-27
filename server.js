const { createApp } = require('./app');
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT должен быть целым числом от 1 до 65535.');
  process.exit(1);
}
const server = createApp().listen(port, host, () => {
  console.log(`Стол заказов проектов · IT.МОСКВА: http://${host}:${port}`);
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Порт ${port} занят. Задай другой PORT.` : `Не удалось запустить сервер: ${error.message}`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => { process.exitCode = 0; }));
}
