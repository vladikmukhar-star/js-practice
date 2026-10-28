// ===== Слайдер =====
// Пиши весь код тут.

// 1. Масив посилань на фото
// const images = [
//   "https://picsum.photos/id/1015/600/400",
//   "https://picsum.photos/id/1016/600/400",
//   "https://picsum.photos/id/1018/600/400",
//   "https://picsum.photos/id/1019/600/400",
//   "https://picsum.photos/id/1020/600/400",
// ];

// 2. Поточний індекс
// let currentIndex = 0;

// 3. Знайди елементи
// const imgEl = document.querySelector("#slide-image");
// const currentEl = document.querySelector("#current");
// const totalEl = document.querySelector("#total");
// const btnPrev = document.querySelector("#btn-prev");
// const btnNext = document.querySelector("#btn-next");

// 4. Покажи скільки всього фото
// totalEl.textContent = images.length;

// 5. Функція оновлення картинки
// function showSlide() {
//   imgEl.src = images[currentIndex];
//   currentEl.textContent = currentIndex + 1;
// }

// 6. Кнопки
// btnNext.addEventListener("click", function () {
//   // збільш currentIndex, якщо вийшов за кінець — став 0
//   // виклич showSlide()
// });

// btnPrev.addEventListener("click", function () {
//   // зменш currentIndex, якщо менше 0 — став останній
//   // виклич showSlide()
// });

// 7. Покажи перше фото одразу
// showSlide();
