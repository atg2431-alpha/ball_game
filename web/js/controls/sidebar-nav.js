/**
 * Sidebar Navigation
 *
 * Manages the collapsible sidebar navigation.
 * Clicking a category opens its detail panel; clicking again closes it.
 * Only one panel is visible at a time.
 */

export function initSidebarNav() {
  const navItems = document.querySelectorAll('.sidebar-nav__item');
  const detailPanel = document.getElementById('sidebar-detail-panel');
  const sections = detailPanel.querySelectorAll('.detail-section');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const panelName = item.dataset.panel;
      const isAlreadyActive = item.classList.contains('active');

      // Deactivate all nav items and sections
      navItems.forEach(i => i.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      if (isAlreadyActive) {
        // Toggle off — close the panel entirely
        detailPanel.classList.remove('open');
      } else {
        // Activate the clicked item and its section
        item.classList.add('active');
        const targetSection = detailPanel.querySelector(`.detail-section[data-panel="${panelName}"]`);
        if (targetSection) {
          targetSection.classList.add('active');
        }
        detailPanel.classList.add('open');

        // Re-trigger the slide-in animation
        detailPanel.style.animation = 'none';
        // Force reflow to restart the animation
        detailPanel.offsetHeight;
        detailPanel.style.animation = '';
      }
    });
  });
}
