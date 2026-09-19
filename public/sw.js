self.addEventListener("push", (event) => {
  let dados = {
    titulo: "Beatriz Coutinho Fisioterapia",
    corpo: "Você tem novidades no app.",
    url: "/inicio",
  };

  if (event.data) {
    try {
      dados = { ...dados, ...event.data.json() };
    } catch {
      // payload sem JSON válido — usa os valores padrão
    }
  }

  event.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icone.svg",
      badge: "/icone.svg",
      data: { url: dados.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/inicio";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if (janela.url.includes(url) && "focus" in janela) return janela.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
