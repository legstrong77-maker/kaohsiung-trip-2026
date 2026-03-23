document.addEventListener("DOMContentLoaded", () => {

    // 1. Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 2. Hero Section Animations
    const tl = gsap.timeline();
    tl.from(".gsap-title", { y: 50, opacity: 0, duration: 1, ease: "back.out(1.7)" })
      .from(".gsap-subtitle", { y: 20, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.5")
      .from(".scroll-indicator", { opacity: 0, duration: 1 }, "-=0.2");

    // 3. Day Toggle Logic
    const toggleBtns = document.querySelectorAll(".toggle-btn");
    const sections = document.querySelectorAll(".itinerary-section");

    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove active classes
            toggleBtns.forEach(b => b.classList.remove("active"));
            sections.forEach(s => {
                s.classList.remove("active");
                // Reset GSAP animations for the section elements
                gsap.set(s.querySelectorAll(".gsap-timeline-item"), { clearProps: "all" });
            });

            // Add active class to clicked button and target section
            btn.classList.add("active");
            const targetId = `day${btn.dataset.day}`;
            const targetSection = document.getElementById(targetId);
            targetSection.classList.add("active");

            // Re-trigger scroll animations for the new active section
            ScrollTrigger.refresh();
            initTimelineAnimations(targetSection);
        });
    });

    // 4. Scroll Animations for Timeline
    function initTimelineAnimations(section = document) {
        const items = section.querySelectorAll(".gsap-timeline-item");
        items.forEach((item, index) => {
            gsap.fromTo(item, 
                { opacity: 0, x: -30 },
                { 
                    opacity: 1, 
                    x: 0, 
                    duration: 0.6, 
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: item,
                        start: "top 85%", // Trigger when top of element hits 85% of screen
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }

    // Initialize animations for first load
    initTimelineAnimations(document.getElementById("day1"));

    // Other Scroll Animations
    gsap.utils.toArray('.gsap-fade-up').forEach(elem => {
        gsap.fromTo(elem,
            { opacity: 0, y: 30 },
            {
                opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
                scrollTrigger: {
                    trigger: elem,
                    start: "top 90%"
                }
            }
        );
    });

    // 5. Leaflet Map Initialization
    // Coordinates for Kaohsiung Center (near Love River/Pier-2)
    const map = L.map('itinerary-map').setView([22.6200, 120.2800], 13);

    // Add CartoDB Positron tile layer (clean, modern map style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Custom Icon (Primary Color)
    const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color: var(--primary); width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.4);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    // Highlight Icon (Secondary Color)
    const highlightIcon = L.divIcon({
        className: 'custom-highlight-marker',
        html: `<div style="background-color: var(--secondary); width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    // Markers Data
    const locations = [
        { name: "鼓山輪渡站", coords: [22.6186, 120.2704], icon: customIcon },
        { name: "旗津輪渡站 (旗津散策起點)", coords: [22.6136, 120.2676], icon: highlightIcon },
        { name: "星空隧道", coords: [22.6120, 120.2635], icon: highlightIcon },
        { name: "旗津海水浴場", coords: [22.6075, 120.2685], icon: highlightIcon },
        { name: "愛之船乘船處 (愛河)", coords: [22.6231, 120.2885], icon: customIcon },
        { name: "駁二藝術特區 / 鹽埕埔", coords: [22.6190, 120.2818], icon: highlightIcon },
        { name: "壽山動物園", coords: [22.6366, 120.2762], icon: highlightIcon },
        { name: "二二八和平紀念公園", coords: [22.6214, 120.2872], icon: customIcon }
    ];

    locations.forEach(loc => {
        L.marker(loc.coords, { icon: loc.icon })
         .addTo(map)
         .bindPopup(`<b>${loc.name}</b>`);
    });

    // Refresh Map when Day toggles or window resizes, sometimes Leaflet bugs in hidden containers
    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        });
    });

    // 6. Modal Logic for Itinerary Details
    const modal = document.getElementById('detail-modal');
    const modalClose = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalTag = document.getElementById('modal-tag');
    const modalDesc = document.getElementById('modal-desc');
    let modalMapInstance = null;
    let modalMarker = null;

    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item) => {
        item.addEventListener('click', () => {
            // Add slight click effect
            gsap.fromTo(item, {scale: 0.98}, {scale: 1, duration: 0.2});
            
            const title = item.querySelector('h3').innerText;
            const tagEl = item.querySelector('.transport-tag');
            const pEls = item.querySelectorAll('p:not(.transport-tag), ul');
            
            modalTitle.innerText = title;
            if(tagEl) {
                modalTag.innerText = tagEl.innerText;
                modalTag.style.display = 'inline-block';
            } else {
                modalTag.style.display = 'none';
            }
            
            let descHtml = '';
            pEls.forEach(p => {
                descHtml += p.outerHTML;
            });
            modalDesc.innerHTML = descHtml;
            
            modal.classList.add('active');
            
            // Determine Coordinates based on keyword
            let coords = [22.6200, 120.2800]; // Default Kaohsiung
            let zoom = 14;
            if(title.includes('鼓山') || title.includes('輪渡') || tagEl?.innerText.includes('鼓山')) coords = [22.6186, 120.2704];
            if(title.includes('轉乘') || title.includes('哈瑪星')) coords = [22.6160, 120.2745];
            if(title.includes('旗津')) { coords = [22.6136, 120.2676]; zoom = 15; }
            if(title.includes('愛之船') || title.includes('愛河')) { coords = [22.6231, 120.2885]; zoom = 15; }
            if(title.includes('晚餐') || title.includes('夜市') || title.includes('駁二') || title.includes('休息')) coords = [22.6190, 120.2818];
            if(title.includes('動物園')) { coords = [22.6366, 120.2762]; zoom = 15; }
            if(title.includes('二二八')) { coords = [22.6214, 120.2872]; zoom = 16; }
            if(title.includes('台南')) { coords = [22.9971, 120.2126]; zoom = 15; }
            
            setTimeout(() => {
                if(!modalMapInstance) {
                    modalMapInstance = L.map('modal-map').setView(coords, zoom);
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; OpenStreetMap',
                        maxZoom: 20
                    }).addTo(modalMapInstance);
                    modalMarker = L.marker(coords, {icon: highlightIcon}).addTo(modalMapInstance);
                } else {
                    modalMapInstance.setView(coords, zoom);
                    modalMarker.setLatLng(coords);
                    modalMapInstance.invalidateSize();
                }
            }, 300);
        });
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('active');
    });
});
