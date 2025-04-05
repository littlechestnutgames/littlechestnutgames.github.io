window.addEventListener("scroll", () => {
    const header = document.querySelector("header");
    const collapse = window.scrollY >= 20;
    header.classList.toggle("collapse", collapse);
});
