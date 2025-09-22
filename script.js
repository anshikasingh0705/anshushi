/**
 * Portfolio Website JavaScript
 * Author: Anshika Singh
 * Description: Interactive functionality for portfolio website
 */

// =================================
// SMOOTH SCROLLING
// =================================
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Handle navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', this.handleClick.bind(this));
        });
    }

    handleClick(e) {
        e.preventDefault();
        const target = document.querySelector(e.currentTarget.getAttribute('href'));
        
        if (target) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
}

// =================================
// SCROLL ANIMATIONS
// =================================
class ScrollAnimations {
    constructor() {
        this.observer = null;
        this.init();
    }

    init() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.observer = new IntersectionObserver(this.handleIntersect.bind(this), options);
        this.observeElements();
    }

    observeElements() {
        const elementsToAnimate = document.querySelectorAll('.section__title, .work__item, .about');
        elementsToAnimate.forEach(el => this.observer.observe(el));
    }

    handleIntersect(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                this.observer.unobserve(entry.target);
            }
        });
    }
}

// =================================
// HEADER EFFECTS
// =================================
class HeaderEffects {
    constructor() {
        this.header = document.querySelector('.header');
        this.init();
    }

    init() {
        window.addEventListener('scroll', this.handleScroll.bind(this));
    }

    handleScroll() {
        if (window.scrollY > 100) {
            this.header.style.background = 'rgba(230, 230, 230, 0.98)';
        } else {
            this.header.style.background = 'rgba(230, 230, 230, 0.95)';
        }
    }
}

// =================================
// 3D MODEL PLACEHOLDER
// =================================
// Space reserved for future 3D Spline model integration

// =================================
// PERFORMANCE MONITOR
// =================================
class PerformanceMonitor {
    constructor() {
        this.init();
    }

    init() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            this.logPerformance();
        });
    }

    logPerformance() {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }
    }
}

// =================================
// INITIALIZATION
// =================================
class PortfolioApp {
    constructor() {
        this.components = [];
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initComponents();
            });
        } else {
            this.initComponents();
        }
    }

    initComponents() {
        // Initialize all components
        this.components.push(new SmoothScroll());
        this.components.push(new ScrollAnimations());
        this.components.push(new HeaderEffects());
        this.components.push(new PerformanceMonitor());

        // Set body opacity for smooth entrance
        document.body.style.opacity = '1';
        
        console.log('Portfolio initialized successfully');
    }

    // Public method to destroy all components if needed
    destroy() {
        this.components.forEach(component => {
            if (component.destroy && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        this.components = [];
    }
}

// =================================
// APP INITIALIZATION
// =================================
const portfolio = new PortfolioApp();

// Handle window resize events
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Space for future resize optimizations
        console.log('Window resized');
    }, 250);
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
}