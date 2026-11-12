(function () {
  "use strict";

  const KEYS = {
    products: "dulces-delicias-products",
    cart: "dulces-delicias-cart",
    customer: "dulces-delicias-customer",
    orders: "dulces-delicias-orders",
    currentOrder: "dulces-delicias-current-order"
  };
  const seedProducts = [
    { id: "PD-001", name: "Concha de vainilla", category: "Pan dulce", price: 15, cost: 6.5, description: "Concha tradicional, suave y recién horneada.", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop", stock: 30, visible: true, season: false },
    { id: "PS-004", name: "Baguette tradicional", category: "Pan salado", price: 25, cost: 11, description: "Corteza crujiente y miga suave con masa madre.", image: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?q=80&w=600&auto=format&fit=crop", stock: 20, visible: true, season: false },
    { id: "PA-012", name: "Pastel de tres leches", category: "Pasteles", price: 100, cost: 55, description: "Pastel esponjoso bañado en tres leches.", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop", stock: 0, visible: true, season: false },
    { id: "PD-020", name: "Pan de muerto", category: "Pan dulce", price: 32, cost: 14, description: "Pan de temporada aromático y esponjoso.", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600&auto=format&fit=crop", stock: 12, visible: true, season: true },
    { id: "PD-005", name: "Croissant de mantequilla", category: "Pan dulce", price: 28, cost: 13, description: "Hojaldrado artesanal preparado con mantequilla.", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=600&auto=format&fit=crop", stock: 0, visible: true, season: false }
  ];

  function read(key, fallback) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("bakery:data-changed", { detail: { key: key } }));
  }
  function products() {
    const saved = read(KEYS.products, null);
    if (saved) return saved;
    write(KEYS.products, seedProducts);
    return seedProducts;
  }
  function cart() { return read(KEYS.cart, []); }
  function money(value) { return "$" + Number(value || 0).toFixed(2); }
  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function productById(id) { return products().find(function (product) { return product.id === id; }); }
  function cartLines() {
    return cart().map(function (line) {
      const product = productById(line.id);
      return product ? { product: product, quantity: line.quantity } : null;
    }).filter(Boolean);
  }
  function cartTotal() {
    return cartLines().reduce(function (sum, line) { return sum + line.product.price * line.quantity; }, 0);
  }
  function addToCart(id, quantity) {
    const product = productById(id);
    if (!product || !product.visible || product.stock <= 0) return;
    const amount = Math.max(1, Math.floor(Number(quantity) || 1));
    const lines = cart();
    const line = lines.find(function (item) { return item.id === id; });
    const next = Math.min(product.stock, (line ? line.quantity : 0) + amount);
    if (line) line.quantity = next;
    else lines.push({ id: id, quantity: next });
    write(KEYS.cart, lines);
    alert("Agregaste " + product.name + " al carrito.");
  }
  function productCard(product) {
    const soldOut = product.stock <= 0;
    return '<article class="bg-white rounded-2xl border border-[#F3E8C9] overflow-hidden shadow-sm flex flex-col">' +
      '<a href="producto-detalle.html?id=' + encodeURIComponent(product.id) + '" class="relative h-48 bg-stone-100 block">' +
      '<img src="' + escapeText(product.image || "") + '" alt="' + escapeText(product.name) + '" class="w-full h-full object-cover">' +
      '<span class="absolute top-3 left-3 ' + (soldOut ? "bg-[#DC2626]" : "bg-[#059669]") + ' text-white text-[10px] font-bold px-2 py-1 rounded-md">' + (soldOut ? "AGOTADO" : "DISPONIBLE") + "</span></a>" +
      '<div class="p-5 flex-1"><div class="flex justify-between gap-3"><h2 class="font-bold text-lg text-[#512B11]">' + escapeText(product.name) + '</h2><strong class="text-[#D97706]">' + money(product.price) + "</strong></div>" +
      '<p class="text-xs text-stone-500 mt-2">' + escapeText(product.description || "") + '</p><p class="text-xs text-stone-400 mt-2">' + escapeText(product.category) + "</p></div>" +
      '<div class="p-5 pt-0"><button data-add="' + escapeText(product.id) + '" ' + (soldOut ? "disabled" : "") +
      ' class="w-full bg-[#D97706] text-white text-xs font-bold py-2.5 rounded-lg disabled:bg-stone-300">' + (soldOut ? "Sin stock disponible" : "Agregar al carrito") + "</button></div></article>";
  }
  function bindAddButtons(root) {
    root.querySelectorAll("[data-add]").forEach(function (button) {
      button.addEventListener("click", function () { addToCart(button.dataset.add, 1); });
    });
  }
  function renderStoreCatalog() {
    const container = document.querySelector("[data-product-list]");
    if (!container) return;
    const filter = container.dataset.category || "";
    const list = products().filter(function (product) {
      return product.visible && (!filter || product.category.toLowerCase() === filter.toLowerCase());
    });
    container.innerHTML = list.length ? list.map(productCard).join("") : '<p class="text-stone-500">No hay productos disponibles en esta categoría.</p>';
    bindAddButtons(container);
  }
  function bindCategoryFilters() {
    const buttons = document.querySelectorAll("[data-filter]");
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        const container = document.querySelector("[data-product-list]");
        if (container) container.dataset.category = button.dataset.filter;
        buttons.forEach(function (item) { item.classList.remove("bg-[#D97706]", "text-white", "font-bold"); });
        button.classList.add("bg-[#D97706]", "text-white", "font-bold");
        renderStoreCatalog();
      });
    });
  }
  function renderCartBadge() {
    const count = cartLines().reduce(function (sum, line) { return sum + line.quantity; }, 0);
    document.querySelectorAll("[data-cart-count]").forEach(function (badge) { badge.textContent = count; });
  }
  function renderCartPage() {
    const container = document.querySelector("[data-cart-list]");
    if (!container) return;
    const lines = cartLines();
    container.innerHTML = lines.length ? lines.map(function (line) {
      return '<article class="bg-white p-4 rounded-xl border border-[#F3E8C9] mb-4 flex flex-wrap items-center justify-between gap-3">' +
        '<div><h2 class="font-bold text-stone-800 text-sm">' + escapeText(line.product.name) + '</h2><p class="text-xs text-stone-500">' + money(line.product.price) + " c/u</p></div>" +
        '<div class="flex items-center gap-3"><input data-quantity="' + escapeText(line.product.id) + '" type="number" min="1" max="' + line.product.stock + '" value="' + line.quantity + '" class="w-16 border rounded p-1 text-center">' +
        '<strong>' + money(line.product.price * line.quantity) + '</strong><button data-remove="' + escapeText(line.product.id) + '" class="text-red-600 text-sm">Quitar</button></div></article>';
    }).join("") : '<p class="rounded-xl bg-white p-6 text-stone-500">Tu carrito está vacío. <a class="text-amber-700 underline" href="catalogo.html">Explora el catálogo</a>.</p>';
    const total = document.querySelector("[data-cart-total]");
    if (total) total.textContent = money(cartTotal());
    container.querySelectorAll("[data-quantity]").forEach(function (input) {
      input.addEventListener("change", function () {
        const linesNow = cart();
        const current = linesNow.find(function (item) { return item.id === input.dataset.quantity; });
        if (current) current.quantity = Math.max(1, Math.min(Number(input.max), Math.floor(Number(input.value) || 1)));
        write(KEYS.cart, linesNow);
        renderCartPage();
      });
    });
    container.querySelectorAll("[data-remove]").forEach(function (button) {
      button.addEventListener("click", function () {
        write(KEYS.cart, cart().filter(function (item) { return item.id !== button.dataset.remove; }));
        renderCartPage();
      });
    });
  }
  function renderSummary() {
    const container = document.querySelector("[data-order-summary]");
    if (!container) return;
    const lines = cartLines();
    container.innerHTML = lines.length ? lines.map(function (line) {
      return '<li class="py-3 flex justify-between gap-3"><span>' + line.quantity + "× " + escapeText(line.product.name) +
        '</span><span class="font-medium">' + money(line.product.price * line.quantity) + "</span></li>";
    }).join("") : '<li class="py-3 text-stone-500">Tu carrito está vacío.</li>';
    document.querySelectorAll("[data-subtotal]").forEach(function (el) { el.textContent = money(cartTotal()); });
    const savedCustomer = read(KEYS.customer, {});
    const delivery = document.querySelector('input[name="entrega"]:checked');
    const deliveryType = delivery ? delivery.value : savedCustomer.entrega || "domicilio";
    const shipping = deliveryType === "recogida" ? 0 : 35;
    document.querySelectorAll("[data-order-shipping]").forEach(function (el) { el.textContent = money(shipping); });
    document.querySelectorAll("[data-order-total]").forEach(function (el) { el.textContent = money(cartTotal() + shipping); });
    document.querySelectorAll("#costo-envio").forEach(function (el) { el.textContent = shipping ? money(shipping) : "Gratis"; });
    document.querySelectorAll("#total").forEach(function (el) { el.textContent = money(cartTotal() + shipping); });
  }
  function bindCheckout() {
    const form = document.querySelector("main form");
    if (!form) return;
    if (location.pathname.endsWith("contacto-entrega.html")) {
      const saved = read(KEYS.customer, {});
      Object.keys(saved).forEach(function (name) {
        const field = form.elements.namedItem(name);
        if (field && field.type !== "radio") field.value = saved[name];
      });
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!cartLines().length) {
          alert("Tu carrito está vacío. Agrega productos antes de continuar.");
          location.href = "carrito.html";
          return;
        }
        const customer = {};
        new FormData(form).forEach(function (value, name) { customer[name] = value; });
        write(KEYS.customer, customer);
        location.href = "pago.html";
      });
    }
    if (location.pathname.endsWith("pago.html")) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        const lines = cartLines();
        if (!lines.length) {
          alert("Tu carrito está vacío. Agrega productos antes de pagar.");
          location.href = "carrito.html";
          return;
        }
        const items = lines.map(function (line) {
          return { id: line.product.id, name: line.product.name, price: line.product.price, quantity: line.quantity };
        });
        const customer = read(KEYS.customer, {});
        const subtotal = items.reduce(function (sum, line) { return sum + line.price * line.quantity; }, 0);
        const shipping = customer.entrega === "recogida" ? 0 : 35;
        const payment = form.querySelector('input[name="pago"]:checked');
        const order = {
          id: "ORD-" + Date.now().toString().slice(-8),
          createdAt: new Date().toISOString(),
          customer: customer,
          items: items,
          subtotal: subtotal,
          shipping: shipping,
          total: subtotal + shipping,
          payment: payment ? payment.value : "efectivo",
          status: "Pendiente de preparación"
        };
        const stock = products().map(function (product) {
          const ordered = items.find(function (line) { return line.id === product.id; });
          return ordered ? Object.assign({}, product, { stock: Math.max(0, product.stock - ordered.quantity) }) : product;
        });
        write(KEYS.products, stock);
        write(KEYS.orders, read(KEYS.orders, []).concat(order));
        write(KEYS.currentOrder, order);
        write(KEYS.cart, []);
        location.href = "confirmacion.html";
      });
    }
  }
  function renderOrderPages() {
    const order = read(KEYS.currentOrder, null);
    if (!order) return;
    document.querySelectorAll("[data-order-number]").forEach(function (el) { el.textContent = "#" + order.id; });
    document.querySelectorAll("[data-order-email]").forEach(function (el) { el.textContent = order.customer.correo || ""; });
    document.querySelectorAll("[data-confirmation-title]").forEach(function (el) {
      el.textContent = "¡Gracias, " + (order.customer.nombre || "cliente") + "! Tu pedido fue recibido";
    });
    document.querySelectorAll("[data-order-customer]").forEach(function (el) { el.textContent = order.customer.nombre || ""; });
    document.querySelectorAll("[data-order-subtotal]").forEach(function (el) { el.textContent = money(order.subtotal); });
    document.querySelectorAll("[data-order-shipping]").forEach(function (el) { el.textContent = money(order.shipping); });
    document.querySelectorAll("[data-order-total]").forEach(function (el) { el.textContent = money(order.total); });
    const summary = document.querySelector("[data-order-summary]");
    if (summary) summary.innerHTML = order.items.map(function (item) {
      return '<li class="py-3 flex justify-between gap-3"><span>' + item.quantity + "× " + escapeText(item.name) +
        '</span><span class="font-medium">' + money(item.price * item.quantity) + "</span></li>";
    }).join("");
    const ticketLines = document.querySelector("[data-ticket-lines]");
    if (ticketLines) ticketLines.innerHTML = order.items.map(function (item) {
      return "<tr><td class=\"py-0.5\">" + item.quantity + "</td><td>" + escapeText(item.name) +
        '</td><td class="text-right">' + money(item.price * item.quantity) + "</td></tr>";
    }).join("");
  }
  function renderAdminCatalog() {
    const tbody = document.querySelector("[data-admin-products]");
    if (!tbody) return;
    tbody.innerHTML = products().map(function (product) {
      const state = product.stock <= 0 ? "Agotado" : product.visible ? (product.season ? "Temporada" : "Activo") : "Oculto";
      return '<tr class="hover:bg-yellow-50"><td class="p-4">' + escapeText(product.id) + '</td><td class="p-4">' + escapeText(product.name) +
        '</td><td class="p-4">' + escapeText(product.category) + '</td><td class="p-4">' + money(product.price) +
        '</td><td class="p-4">' + state + '</td><td class="p-4"><div class="flex flex-wrap gap-2">' +
        '<button data-edit="' + escapeText(product.id) + '" class="rounded-lg px-3 py-2 text-sm bg-indigo-700 text-white">Editar</button>' +
        '<button data-toggle="' + escapeText(product.id) + '" class="rounded-lg px-3 py-2 text-sm border">' + (product.visible ? "Ocultar" : "Mostrar") + '</button>' +
        '<button data-delete="' + escapeText(product.id) + '" class="rounded-lg px-3 py-2 text-sm bg-red-600 text-white">Eliminar</button></div></td></tr>';
    }).join("");
    tbody.querySelectorAll("[data-edit]").forEach(function (button) { button.addEventListener("click", function () { openProductForm(productById(button.dataset.edit)); }); });
    tbody.querySelectorAll("[data-toggle]").forEach(function (button) { button.addEventListener("click", function () {
      const item = productById(button.dataset.toggle); item.visible = !item.visible; write(KEYS.products, products()); renderAdminCatalog();
    }); });
    tbody.querySelectorAll("[data-delete]").forEach(function (button) { button.addEventListener("click", function () {
      if (confirm("¿Eliminar este producto del catálogo?")) {
        write(KEYS.products, products().filter(function (item) { return item.id !== button.dataset.delete; }));
        write(KEYS.cart, cart().filter(function (item) { return item.id !== button.dataset.delete; }));
        renderAdminCatalog();
      }
    }); });
  }
  function openProductForm(product) {
    const modal = document.querySelector("#nuevo");
    if (!modal) return;
    const inputs = modal.querySelectorAll("input");
    const select = modal.querySelector("select");
    const textarea = modal.querySelector("textarea");
    modal.dataset.editId = product ? product.id : "";
    inputs[0].value = product ? product.name : "";
    inputs[1].value = product ? product.id : "";
    if (select) select.value = product ? product.category : "Pan dulce";
    inputs[2].value = product ? product.price : "";
    inputs[3].value = product ? product.cost : "";
    if (textarea) textarea.value = product ? product.description : "";
    if (inputs[5]) inputs[5].checked = product ? product.visible : true;
    if (inputs[6]) inputs[6].checked = product ? product.season : false;
    location.hash = "nuevo";
  }
  function bindAdminCatalogForm() {
    const modal = document.querySelector("#nuevo");
    if (!modal) return;
    const links = modal.querySelectorAll("a");
    const save = Array.from(links).find(function (link) { return link.textContent.trim() === "Guardar producto"; });
    if (!save) return;
    save.addEventListener("click", function (event) {
      event.preventDefault();
      const inputs = modal.querySelectorAll("input");
      const name = inputs[0].value.trim();
      const id = inputs[1].value.trim();
      const price = Number(inputs[2].value);
      if (!name || !id || !Number.isFinite(price) || price < 0) {
        alert("Completa nombre, SKU y un precio válido.");
        return;
      }
      const list = products();
      const editing = modal.dataset.editId;
      if (list.some(function (item) { return item.id === id && item.id !== editing; })) {
        alert("Ese SKU ya está registrado.");
        return;
      }
      const old = editing ? productById(editing) : null;
      const next = {
        id: id, name: name, category: modal.querySelector("select").value, price: price,
        cost: Number(inputs[3].value) || 0, description: modal.querySelector("textarea").value.trim(),
        image: old ? old.image : "", stock: old ? old.stock : 10, visible: inputs[5].checked, season: inputs[6].checked
      };
      write(KEYS.products, editing ? list.map(function (item) { return item.id === editing ? next : item; }) : list.concat(next));
      location.hash = "";
      renderAdminCatalog();
    });
  }
  function bindAdminPrices() {
    if (!location.pathname.endsWith("admin-precios.html")) return;
    document.querySelectorAll("tbody tr").forEach(function (row) {
      const name = row.cells[0] && row.cells[0].textContent.trim();
      const input = row.querySelector("input");
      const button = row.querySelector("button");
      if (!name || !input || !button) return;
      const item = products().find(function (product) { return product.name.toLowerCase() === name.toLowerCase(); });
      if (!item) return;
      input.value = item.price;
      button.addEventListener("click", function () {
        const value = Number(input.value);
        if (!Number.isFinite(value) || value < 0) {
          alert("Escribe un precio válido.");
          return;
        }
        const list = products();
        const current = list.find(function (product) { return product.id === item.id; });
        current.price = value;
        write(KEYS.products, list);
        row.cells[2].textContent = money(value);
        const margin = row.cells[4].querySelector("span");
        if (margin) margin.textContent = current.cost > 0 && value > 0 ? Math.round((value - current.cost) / value * 100) + "%" : "—";
        alert("Precio actualizado en el catálogo.");
      });
    });
  }
  function renderProductDetail() {
    if (!location.pathname.endsWith("producto-detalle.html")) return;
    const item = productById(new URLSearchParams(location.search).get("id")) || products().find(function (product) { return product.visible; });
    const heading = document.querySelector("main h1");
    if (!heading || !item) return;
    heading.textContent = item.name;
    const price = document.querySelector("main h1 + p");
    if (price) price.textContent = money(item.price);
    const image = document.querySelector("main img");
    if (image) { image.src = item.image; image.alt = item.name; }
    const button = document.querySelector("main button");
    if (button) button.addEventListener("click", function () {
      addToCart(item.id, document.querySelector('main input[type="number"]')?.value);
    });
  }
  function fixAdminLinks() {
    const paths = { "dashboard.html": "admin-dashboard.html", "catalogo.html": "admin-catalogo.html", "precios.html": "admin-precios.html",
      "inventario.html": "admin-inventario.html", "personal.html": "admin-personal.html", "reportes.html": "admin-reportes.html", "caja.html": "admin-caja.html",
      "historial_reportes.html": "admin-reportes.html", "03-pago.html": "pago.html", "checkout.html": "acceso.html" };
    document.querySelectorAll('a[href]').forEach(function (link) {
      const target = link.getAttribute("href");
      if (!target || target.startsWith("#")) return;
      const hash = target.indexOf("#") >= 0 ? target.slice(target.indexOf("#")) : "";
      const file = target.split("#")[0];
      const isAdminPage = /^admin-/.test(location.pathname.split("/").pop()) || location.pathname.endsWith("auditoria.html");
      if ((isAdminPage || file === "historial_reportes.html" || file === "03-pago.html" || file === "checkout.html") && paths[file]) {
        link.href = paths[file] + hash;
      }
    });
  }
  function refresh() {
    products();
    renderCartBadge();
    renderStoreCatalog();
    renderCartPage();
    renderSummary();
    renderAdminCatalog();
    renderProductDetail();
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      fixAdminLinks();
      bindAdminCatalogForm();
      bindAdminPrices();
      bindCategoryFilters();
      bindCheckout();
      refresh();
      renderOrderPages();
      window.addEventListener("storage", refresh);
      window.addEventListener("bakery:data-changed", refresh);
    } catch (error) {
      console.error("No se pudo cargar el estado de la panadería.", error);
      const message = document.createElement("p");
      message.className = "m-4 rounded border border-red-300 bg-red-50 p-3 text-red-800";
      message.textContent = "No se pudieron cargar los datos guardados. Revisa el almacenamiento del navegador y vuelve a cargar la página.";
      document.body.prepend(message);
    }
  });

  window.BakeryStore = { products: products, cart: cart, addToCart: addToCart, money: money, total: cartTotal };
})();
