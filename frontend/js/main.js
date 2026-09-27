// CountMeIn - Main Interactive JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Footer Copyright Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Mobile Navigation Menu Toggle
  const menuToggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileNavDrawer = document.getElementById('mobile-nav');

  if (menuToggleBtn && mobileNavDrawer) {
    menuToggleBtn.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
    });

    // Close drawer when clicking a mobile nav link
    const mobileLinks = mobileNavDrawer.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
      });
    });
  }

  // 3. Category Filter Chips for Missions
  const filterChips = document.querySelectorAll('.filter-chip');
  const missionCards = document.querySelectorAll('.mission-card');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filterValue = chip.getAttribute('data-filter');

      // Update active state on chips
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      // Filter cards with smooth fade
      missionCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });

  // 4. Smooth Anchor Scrolling
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
});
