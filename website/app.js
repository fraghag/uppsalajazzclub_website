async function loadComponent(url, elementId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            if (elementId === 'header-placeholder') {
                setActiveNavLink();
                const menuBtn = document.getElementById('mobile-menu-btn');
                const mobileMenu = document.getElementById('mobile-menu');
                if (menuBtn && mobileMenu) {
                    menuBtn.addEventListener('click', () => {
                        mobileMenu.classList.toggle('hidden');
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error loading component ${url}:`, error);
    }
}

function setActiveNavLink() {
    const path = window.location.pathname;
    let filename = path.split('/').pop();
    if (!filename || filename === '') {
        filename = 'index.html';
    }
    
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === filename) {
            link.classList.add('text-primary-container', 'dark:text-primary-container', 'font-black', 'border-b-2', 'border-primary-container');
            link.classList.remove('hover:text-primary-container', 'dark:hover:text-primary-container');
        } else {
            link.classList.remove('text-primary-container', 'dark:text-primary-container', 'font-black', 'border-b-2', 'border-primary-container');
            link.classList.add('hover:text-primary-container', 'dark:hover:text-primary-container');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('components/header.html', 'header-placeholder');
    loadComponent('components/footer.html', 'footer-placeholder');

    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;
    const EVENTS_URL = 'data/events.json';

    const images = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCuFV_j1eTaRENz9a9K4KnKFEXcYS-zJBnEnBw9go3kQ_mF_8iyRRbfl0iPxRC5g_wOX6wAyjC4SdOFNLaEfBCtRMBSIOXBOEBm4fMth1_CmNmh-Pf32bs0LByAHfFPLvFEvZs1Hx8wRs-ZAgmJQWh-_Aj8NF6JH5Rd1fvn8WGbJkAZ_Az2DfDcPypH4nfPaCaymYeuq2RU548OY-7eT5qTEaP-Wfa9P-ws4lA4hpk6_-ViY7ut033pT0ggRrXxTkrJ5fCb0nMxPzMe",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAib9QqIb9jsfx9koWAFHZGes0fWgCajM37Za-ggvjy3R8o0Gam7kc67ZSYxc43oQZxWt39vGZ33CLbjw86EbnDUFSO68cqpHHyV0DfiQUGNkuQEtX82N-jDlkqNI1N08MSE2hxYfShvrLTnaorXmPFQlcuEF-mARpy7vCNuUu-nlKVKMQ7vZ3AfDxsp-o_E9zJ11Sd1klTm5g7vp2ALRjVDyyvra0jw_2W3tsVg7GM0b1YyB91GKWXH-zPorJw5beNWwjTgyZq_srs",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBO2eR5LgZ99Yh0ZkBS8Ha8UHnQLhLjDHURWkeQ3Xmdn-YnxVmpBDfphVgCo-ad0kAHGMe1k7Hj6BaVUSp98tivCYXJmgUJgsVA25KbkuYCZm-5wXezmBtL1Cb5HDiOjhVm7-f3RfN_-XxgJHzvTBA6YF648zCOeKoEawhSJ21wSRd8ObUHDNefjPuo8OJ-TJ6o2zmr3GX5cDEmVWikMDKRVQ9zqklgvfp1j2m13vIH5_nDOV1qXHOpv4x22h_6PawTscuYtTa6aJRm"
    ];

    function formatShortDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const currentYear = new Date().getFullYear();
        const eventYear = date.getFullYear();
        
        const options = { day: 'numeric', month: 'short' };
        if (eventYear !== currentYear) {
            options.year = 'numeric';
        }
        
        return new Intl.DateTimeFormat('sv-SE', options).format(date).toUpperCase();
    }

    function formatTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit' }).format(date);
    }

    function createEventCard(event, index) {
        const dateStr = formatShortDate(event.start_time);
        const timeStr = formatTime(event.start_time);
        
        const title = event.name || 'Jazzkonsert';
        const location = event.place ? event.place.name || event.place : 'Uppsala';
        const description = event.description || 'Välkommen till en fantastisk jazzkväll.';
        const url = event.url || '#';
        const imgUrl = event.image || images[index % images.length];

        const template = `
            <article class="group bg-surface rounded-lg overflow-hidden border-4 border-surface-variant relative flex flex-col hover:border-primary-container transition-colors duration-300 h-full cursor-pointer">
                <div class="h-64 overflow-hidden relative shrink-0">
                    <div class="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10"></div>
                    <img alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" src="${imgUrl}"/>
                    <div class="absolute top-4 right-4 z-20 bg-surface/90 border-2 border-primary-container px-3 py-1 rounded-lg text-primary-container font-label-bold text-label-bold">
                        ${dateStr}
                    </div>
                </div>
                <div class="p-6 flex-grow flex flex-col justify-between relative z-20 bg-surface">
                    <div>
                        <span class="font-label-bold text-label-bold text-primary-container mb-2 block uppercase">${location}</span>
                        <h3 class="font-headline-md text-headline-lg-mobile md:text-headline-md text-on-background mb-2">${title}</h3>
                        <p class="font-body-md text-body-md text-on-surface-variant mb-6 line-clamp-3">${description}</p>
                    </div>
                    <div class="flex items-center justify-end mt-auto pt-4 border-t-2 border-surface-variant">
                        <span class="font-label-bold text-label-bold text-on-surface">${timeStr}</span>
                    </div>
                </div>
            </article>
        `;
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = template.trim();
        const card = wrapper.firstChild;

        card.addEventListener('click', () => openModal(event, imgUrl, dateStr, timeStr));

        return card;
    }

    // Modal Logic
    const modal = document.getElementById('event-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');
    const modalLocation = document.getElementById('modal-location');
    const modalDate = document.getElementById('modal-date');
    const modalTime = document.getElementById('modal-time');
    const modalDescription = document.getElementById('modal-description');
    const modalFbLink = document.getElementById('modal-fb-link');
    const closeModalBtn = document.getElementById('close-modal');
    const modalOverlay = document.getElementById('modal-overlay');

    const modalContentWrapper = document.getElementById('modal-content-wrapper');
    const modalImageOverlay = document.getElementById('modal-image-overlay');

    function handleModalScroll() {
        if (!modalContentWrapper || !modalImage) return;
        
        const scrollTop = modalContentWrapper.scrollTop;
        const fadeHeight = 300; // Height over which to fade out
        
        // Calculate opacity and scale
        const opacity = Math.max(0, 1 - scrollTop / fadeHeight);
        const scale = 1 + (scrollTop / 1000); // Subtle zoom in
        
        modalImage.style.opacity = opacity;
        modalImage.style.transform = `scale(${scale})`;
        
        if (modalImageOverlay) {
            modalImageOverlay.style.opacity = Math.max(0.4, 0.6 + (scrollTop / 500));
        }
    }

    if (modalContentWrapper) {
        modalContentWrapper.addEventListener('scroll', handleModalScroll);
    }

    function openModal(event, imgUrl, dateStr, timeStr) {
        if (!modal) return;
        
        modalImage.src = imgUrl;
        
        modalTitle.textContent = event.name || 'Jazzkonsert';
        modalLocation.textContent = event.place ? event.place.name || event.place : 'Uppsala';
        modalDate.textContent = dateStr;
        modalTime.textContent = timeStr;
        modalDescription.textContent = event.description || '';
        modalFbLink.href = event.url || '#';
        
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Reset scroll and image effects
        if (modalContentWrapper) {
            modalContentWrapper.scrollTop = 0;
            // Force a scroll event to trigger handleModalScroll and reset image state
            handleModalScroll();
            
            // Second pass after a frame to be absolutely sure (browsers can be finicky with hidden overflow)
            requestAnimationFrame(() => {
                modalContentWrapper.scrollTop = 0;
                handleModalScroll();
            });
        }
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = ''; // Restore scrolling
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    function renderFallback(message = "Just nu vilar vi instrumenten. Håll utkik här för kommande spelningar!") {
        eventsContainer.innerHTML = `<div class="col-span-full text-center py-12 px-6 bg-surface-container-low rounded-lg border-2 border-surface-variant text-on-surface-variant">${message}</div>`;
    }

    async function fetchEvents() {
        try {
            const response = await fetch(EVENTS_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            let events = await response.json();
            eventsContainer.innerHTML = '';
            
            const pastEventsContainer = document.getElementById('past-events-container');
            const pastEventsSection = document.getElementById('past-events-section');
            if (pastEventsContainer) pastEventsContainer.innerHTML = '';

            if (!Array.isArray(events) || events.length === 0) {
                renderFallback();
                return;
            }

            // Filter for upcoming events (start_time >= now - 6 hours to account for ongoing events)
            const now = new Date();
            const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
            
            const upcomingEvents = events
                .filter(event => new Date(event.start_time) >= sixHoursAgo)
                .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

            const pastEvents = events
                .filter(event => new Date(event.start_time) < sixHoursAgo)
                .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

            // Render Upcoming Events
            if (upcomingEvents.length === 0) {
                renderFallback();
            } else {
                upcomingEvents.forEach((event, index) => {
                    const card = createEventCard(event, index);
                    eventsContainer.appendChild(card);
                });
            }

            // Render Past Events
            if (pastEventsContainer && pastEvents.length > 0) {
                pastEventsSection.classList.remove('hidden');
                
                const ITEMS_PER_PAGE = 9;
                let displayedCount = 0;
                const loadMoreBtn = document.getElementById('load-more-btn');
                const loadMoreContainer = document.getElementById('load-more-container');

                function renderNextPastEvents() {
                    const nextBatch = pastEvents.slice(displayedCount, displayedCount + ITEMS_PER_PAGE);
                    nextBatch.forEach((event, index) => {
                        const card = createEventCard(event, displayedCount + index + 10);
                        pastEventsContainer.appendChild(card);
                    });
                    
                    displayedCount += nextBatch.length;
                    
                    if (displayedCount >= pastEvents.length) {
                        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
                    } else {
                        if (loadMoreContainer) loadMoreContainer.classList.remove('hidden');
                    }
                }

                // Initial render
                renderNextPastEvents();

                if (loadMoreBtn) {
                    // Remove any existing listeners by cloning
                    const newBtn = loadMoreBtn.cloneNode(true);
                    loadMoreBtn.parentNode.replaceChild(newBtn, loadMoreBtn);
                    newBtn.addEventListener('click', renderNextPastEvents);
                }
            }

        } catch (error) {
            console.error('Error fetching events:', error);
            renderFallback("Kunde inte ladda konserter just nu. Försök igen senare.");
        }
    }

    fetchEvents();
});
