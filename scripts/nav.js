document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll("nav a");

    let currentPage = window.location.pathname.split("/").pop();

    if (!currentPage || currentPage === "") {
        currentPage = "index.html";
    }

    links.forEach(link => {
        const href = link.getAttribute("href");

        if (href === currentPage) {
            link.classList.add("active-page");
        } else {
            link.classList.remove("active-page");
        }
    });
});