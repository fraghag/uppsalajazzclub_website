document.addEventListener('DOMContentLoaded', () => {
    const eventsContainer = document.getElementById('events-container');
    const EVENTS_URL = 'data/events.json';

    const images = [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCuFV_j1eTaRENz9a9K4KnKFEXcYS-zJBnEnBw9go3kQ_mF_8iyRRbfl0iPxRC5g_wOX6wAyjC4SdOFNLaEfBCtRMBSIOXBOEBm4fMth1_CmNmh-Pf32bs0LByAHfFPLvFEvZs1Hx8wRs-ZAgmJQWh-_Aj8NF6JH5Rd1fvn8WGbJkAZ_Az2DfDcPypH4nfPaCaymYeuq2RU548OY-7eT5qTEaP-Wfa9P-ws4lA4hpk6_-ViY7ut033pT0ggRrXxTkrJ5fCb0nMxPzMe",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAib9QqIb9jsfx9koWAFHZGes0fWgCajM37Za-ggvjy3R8o0Gam7kc67ZSYxc43oQZxWt39vGZ33CLbjw86EbnDUFSO68cqpHHyV0DfiQUGNkuQEtX82N-jDlkqNI1N08MSE2hxYfShvrLTnaorXmPFQlcuEF-mARpy7vCNuUu-nlKVKMQ7vZ3AfDxsp-o_E9zJ11Sd1klTm5g7vp2ALRjVDyyvra0jw_2W3tsVg7GM0b1YyB91GKWXH-zPorJw5beNWwjTgyZq_srs",
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBO2eR5LgZ99Yh0ZkBS8Ha8UHnQLhLjDHURWkeQ3Xmdn-YnxVmpBDfphVgCo-ad0kAHGMe1k7Hj6BaVUSp98tivCYXJmgUJgsVA25KbkuYCZm-5wXezmBtL1Cb5HDiOjhVm7-f3RfN_-XxgJHzvTBA6YF648zCOeKoEawhSJ21wSRd8ObUHDNefjPuo8OJ-TJ6o2zmr3GX5cDEmVWikMDKRVQ9zqklgvfp1j2m13vIH5_nDOV1qXHOpv4x22h_6PawTscuYtTa6aJRm"
    ];

    function formatShortDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(date).toUpperCase();
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
        const imgUrl = images[index % images.length];

        const template = `
            <article class="group bg-surface rounded-lg overflow-hidden border-4 border-surface-variant relative flex flex-col hover:border-primary-container transition-colors duration-300 h-full">
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
                    <div class="flex items-center justify-between mt-auto pt-4 border-t-2 border-surface-variant">
                        <span class="font-label-bold text-label-bold text-on-surface">${timeStr}</span>
                        <a href="${url}" target="_blank" rel="noopener noreferrer" class="bg-transparent border-4 border-surface-variant text-on-surface font-label-bold text-label-bold px-6 py-2 rounded-lg hover:border-primary-container hover:text-primary-container transition-all duration-300 inline-block text-center">
                            Biljetter
                        </a>
                    </div>
                </div>
            </article>
        `;
        
        const wrapper = document.createElement('div');
        // If it's the third card on a large screen, make it span in the grid if we wanted (like the template did),
        // but it's simpler to just let it fill normally.
        wrapper.innerHTML = template.trim();
        return wrapper.firstChild;
    }

    function renderFallback(message = "Just nu vilar vi instrumenten. Håll utkik här för kommande spelningar!") {
        eventsContainer.innerHTML = `<div class="col-span-full text-center py-12 px-6 bg-surface-container-low rounded-lg border-2 border-surface-variant text-on-surface-variant">${message}</div>`;
    }

    async function fetchEvents() {
        try {
            const response = await fetch(EVENTS_URL);
            
            if (!response.ok) {
                throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            const events = await response.json();
            eventsContainer.innerHTML = '';

            if (!Array.isArray(events) || events.length === 0) {
                renderFallback();
                return;
            }

            events.forEach((event, index) => {
                const card = createEventCard(event, index);
                eventsContainer.appendChild(card);
            });

        } catch (error) {
            console.error('Error fetching events:', error);
            renderFallback("Kunde inte ladda konserter just nu. Försök igen senare.");
        }
    }

    fetchEvents();
});
