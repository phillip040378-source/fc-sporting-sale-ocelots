/**
 * FC Sporting Sale Ocelots - Presentation Controller
 * Smooth credits-style results scroll using requestAnimationFrame.
 */

document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const playAudioBtn = document.getElementById('playAudioBtn');
  const autoPlayBtn = document.getElementById('autoPlayBtn');
  const bgMusic = document.getElementById('bgMusic');
  let isAudioPlaying = false;
  let autoPlayInterval = null;
  let isAutoPlaying = false;
  let scrollAnimId = null;

  const AUTO_PLAY_DELAY = 7000;
  const SCROLL_SPEED = 1.2; // pixels per frame (~72px/sec at 60fps)

  // Navigate Slides
  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;
    stopResultsScroll();
    slides[currentSlide].classList.remove('active');
    currentSlide = index;
    slides[currentSlide].classList.add('active');

    const currentSlideId = slides[currentSlide].id;

    if (currentSlideId === 'slide-results-scroll') {
      startResultsScroll();
    } else if (currentSlideId === 'slide-goals-counter') {
      startGoalsCounter();
    }

    if (currentSlide === slides.length - 1 && isAutoPlaying) {
      stopAutoPlay();
    }
  }

  // --- Goals Counter Logic ---
  function startGoalsCounter() {
    const counterEl = document.getElementById('goals-counter');
    if (!counterEl) return;
    
    const target = 141;
    const duration = 2500; // 2.5 seconds
    const startTime = performance.now();
    
    // Reset to 0 before starting
    counterEl.innerText = "0";
    
    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use easeOutQuart for a dramatic slowdown at the end
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      const currentCount = Math.floor(easeOut * target);
      counterEl.innerText = currentCount;
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counterEl.innerText = target;
      }
    }
    
    // Small delay to allow slide to fade in first
    setTimeout(() => {
      requestAnimationFrame(updateCounter);
    }, 500);
  }

  function nextSlide() {
    if (currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  }

  // --- Smooth Results Scroll (movie credits style) ---
  function startResultsScroll() {
    const track = document.getElementById('results-track');
    if (!track) return;

    const container = track.parentElement;

    // Immediately reset position off-screen so nothing visible during fade-in
    track.style.top = '200%';

    // Wait for the slide fade-in transition to complete before starting scroll
    setTimeout(() => {
      const containerH = container.offsetHeight || window.innerHeight;
      const trackH = track.scrollHeight || 1200;

      console.log('Results scroll starting:', { containerH, trackH });

      // Start: track positioned just below the visible area
      let pos = containerH;
      track.style.top = pos + 'px';

      // The end position: the entire track has scrolled past the top
      const endPos = -trackH - 20;
      const speed = 1.8;

      function frame() {
        pos -= speed;
        track.style.top = pos + 'px';

        if (pos > endPos) {
          scrollAnimId = requestAnimationFrame(frame);
        } else {
          scrollAnimId = setTimeout(() => {
            scrollAnimId = null;
            nextSlide();
          }, 1000);
        }
      }

      scrollAnimId = requestAnimationFrame(frame);
    }, 800);
  }

  function stopResultsScroll() {
    if (scrollAnimId) {
      cancelAnimationFrame(scrollAnimId);
      clearTimeout(scrollAnimId);
      scrollAnimId = null;
    }
  }

  // --- Auto-play ---
  function startAutoPlay() {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
    isAutoPlaying = true;
    autoPlayBtn.innerHTML = '&#9724;';
    autoPlayBtn.style.background = 'var(--accent-gold)';
    autoPlayBtn.style.color = 'var(--dark-navy)';
    autoPlayBtn.title = 'Stop Auto-play';
    autoPlayInterval = setInterval(() => {
      if (slides[currentSlide].id === 'slide-results-scroll') return;
      if (currentSlide < slides.length - 1) {
        nextSlide();
      } else {
        stopAutoPlay();
      }
    }, AUTO_PLAY_DELAY);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    isAutoPlaying = false;
    autoPlayBtn.innerHTML = '&#9654;';
    autoPlayBtn.style.background = 'rgba(255,255,255,0.1)';
    autoPlayBtn.style.color = '';
    autoPlayBtn.title = 'Auto-play (7s per slide)';
  }

  function toggleAutoPlay() {
    if (isAutoPlaying) stopAutoPlay();
    else startAutoPlay();
  }

  // --- Keyboard Navigation ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isAutoPlaying) stopAutoPlay();
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      if (isAutoPlaying) stopAutoPlay();
      prevSlide();
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } else if (e.key === 'm' || e.key === 'M') {
      toggleMusic();
    } else if (e.key === 'p' || e.key === 'P') {
      toggleAutoPlay();
    }
  });

  // --- Music Toggle ---
  function toggleMusic() {
    if (!bgMusic) return;
    if (isAudioPlaying) {
      bgMusic.pause();
      playAudioBtn.innerHTML = '&#9835;';
      playAudioBtn.style.background = 'rgba(255,255,255,0.1)';
    } else {
      bgMusic.play().catch((err) => {
        console.warn('Audio play failed:', err);
        alert('Could not play audio. Make sure the MP3 is in the music/ folder.');
      });
      playAudioBtn.innerHTML = '&#10074;&#10074;';
      playAudioBtn.style.background = 'var(--primary-blue)';
    }
    isAudioPlaying = !isAudioPlaying;
  }

  // --- Button Navigation ---
  if (nextBtn) nextBtn.addEventListener('click', () => { if (isAutoPlaying) stopAutoPlay(); nextSlide(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { if (isAutoPlaying) stopAutoPlay(); prevSlide(); });
  if (playAudioBtn) playAudioBtn.addEventListener('click', toggleMusic);
  if (autoPlayBtn) autoPlayBtn.addEventListener('click', toggleAutoPlay);

  // Initialize
  goToSlide(0);
});
