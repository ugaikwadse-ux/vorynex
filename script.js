/**
 * Vorynex — interactions & motion
 * IntersectionObserver · requestAnimationFrame · no dependencies
 */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pointerFine = window.matchMedia("(pointer: fine)").matches;

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  /* ——— Loader ——— */
  function initLoader() {
    var el = document.getElementById("page-loader");
    var shell = document.getElementById("app-shell");
    if (!el) return;
    function done() {
      el.classList.add("is-done");
      if (shell) shell.classList.remove("is-loading");
    }
    if (prefersReducedMotion) {
      done();
      return;
    }
    if (document.readyState === "complete") {
      setTimeout(done, 580);
    } else {
      window.addEventListener("load", function () {
        setTimeout(done, 580);
      });
      // Fallback if load event doesn't fire
      setTimeout(done, 3000);
    }
  }

  /* ——— Scroll progress ——— */
  function initScrollProgress() {
    var bar = document.getElementById("scroll-progress");
    if (!bar) return;
    function tick() {
      var sc = document.documentElement;
      var h = sc.scrollHeight - sc.clientHeight;
      var p = h > 0 ? (sc.scrollTop / h) * 100 : 0;
      bar.style.width = p + "%";
    }
    window.addEventListener("scroll", tick, { passive: true });
    tick();
  }

  /* ——— Navbar ——— */
  function initNav() {
    var header = document.getElementById("site-header");
    if (!header) return;
    function u() {
      header.classList.toggle("is-scrolled", window.scrollY > 16);
    }
    window.addEventListener("scroll", u, { passive: true });
    u();

    var toggle = document.getElementById("nav-toggle");
    var menu = document.getElementById("mobile-nav");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var o = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", o ? "true" : "false");
      });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          menu.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }
    window.addEventListener(
      "resize",
      function () {
        if (window.innerWidth >= 1024 && menu) menu.classList.remove("is-open");
      },
      { passive: true }
    );
  }

  /* ——— Cursor glow ——— */
  function initCursorGlow() {
    var glow = document.getElementById("cursor-glow");
    if (!glow || !pointerFine || prefersReducedMotion) return;
    document.body.classList.add("is-pointer-fine");
    var active = false;
    window.addEventListener(
      "mousemove",
      function (e) {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
        if (!active) {
          active = true;
          glow.classList.add("is-active");
        }
      },
      { passive: true }
    );
    document.addEventListener(
      "mouseleave",
      function () {
        active = false;
        glow.classList.remove("is-active");
      },
      true
    );
  }

  /* ——— Magnetic buttons ——— */
  function initMagnetic() {
    if (prefersReducedMotion || !pointerFine) return;
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      var strength = parseFloat(btn.getAttribute("data-magnetic")) || 0.35;
      btn.addEventListener("mousemove", function (e) {
        btn.style.transition = "none";
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + x * strength + "px, " + y * strength + "px) translateZ(0)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
        btn.style.transform = "translate(0, 0) translateZ(0)";
        setTimeout(function () {
          btn.style.transition = "";
          btn.style.transform = "";
        }, 620);
      });
    });
  }

  /* ——— Ripple ——— */
  function initRipple() {
    document.querySelectorAll(".btn-ripple").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        var r = btn.getBoundingClientRect();
        var circle = document.createElement("span");
        var d = Math.max(r.width, r.height);
        circle.className = "ripple";
        circle.style.width = circle.style.height = d + "px";
        circle.style.left = e.clientX - r.left - d / 2 + "px";
        circle.style.top = e.clientY - r.top - d / 2 + "px";
        btn.appendChild(circle);
        setTimeout(function () {
          circle.remove();
        }, 600);
      });
    });
  }

  /* ——— Reveal ——— */
  function initReveal() {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -4% 0px", threshold: 0.06 }
    );

    document.querySelectorAll(".reveal").forEach(function (el) {
      if (el.closest(".reveal-stagger")) return;
      if (prefersReducedMotion) {
        el.classList.add("is-visible");
        return;
      }
      io.observe(el);
    });

    document.querySelectorAll(".reveal-stagger").forEach(function (wrap) {
      if (prefersReducedMotion) {
        Array.prototype.forEach.call(wrap.children, function (child) {
          child.classList.add("is-visible");
        });
        return;
      }
      var io2 = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              Array.prototype.forEach.call(wrap.children, function (child, i) {
                child.style.transitionDelay = i * 0.095 + "s";
                child.classList.add("is-visible");
              });
              io2.unobserve(wrap);
            }
          });
        },
        { threshold: 0.12 }
      );
      io2.observe(wrap);
    });
  }

  /* ——— Parallax ——— */
  function initParallax() {
    if (prefersReducedMotion) return;
    var els = document.querySelectorAll("[data-parallax]");
    if (!els.length) return;
    var ticking = false;
    function update() {
      els.forEach(function (el) {
        var s = parseFloat(el.getAttribute("data-parallax")) || 0.035;
        var rect = el.getBoundingClientRect();
        var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * s;
        el.style.transform = "translate3d(0, " + offset + "px, 0)";
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ——— Counters ——— */
  function initCounters() {
    var statRoot = document.getElementById("hero-stats");
    if (!statRoot) return;

    function animateValue(el, target, suffix, duration) {
      var start = 0;
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / duration);
        var eased = 1 - Math.pow(1 - p, 4);
        var val = Math.round(start + (target - start) * eased);
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function run() {
      statRoot.querySelectorAll("[data-counter]").forEach(function (node) {
        var to = parseInt(node.getAttribute("data-counter"), 10);
        var suf = node.getAttribute("data-suffix") || "";
        if (node.getAttribute("data-counter-text")) {
          node.textContent = node.getAttribute("data-counter-text");
          return;
        }
        animateValue(node, to, suf, 2200);
      });
    }

    if (prefersReducedMotion) {
      run();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(statRoot);
  }

  /* ——— Process timeline ——— */
  function initTimeline() {
    var section = document.getElementById("process");
    var fill = document.querySelector(".timeline-fill");
    var nodes = document.querySelectorAll(".timeline-node");
    if (!section || !fill || !nodes.length) return;

    function setProg(ratio) {
      fill.style.width = Math.round(ratio * 100) + "%";
      var n = nodes.length;
      var idx = Math.min(n - 1, Math.floor(ratio * n + 0.001));
      nodes.forEach(function (node, i) {
        node.classList.toggle("is-active", i <= idx);
      });
    }

    if (prefersReducedMotion) {
      setProg(1);
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            var t0 = null;
            var dur = 2400;
            function tick(ts) {
              if (!t0) t0 = ts;
              var t = Math.min(1, (ts - t0) / dur);
              var eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
              setProg(eased);
              if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    io.observe(section);
    setProg(0);
  }

  /* ——— Service cards expand ——— */
  function initServiceCards() {
    document.querySelectorAll(".service-card").forEach(function (card) {
      var btn = card.querySelector(".service-card__toggle");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var open = card.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  /* ——— Particles ——— */
  function initParticles() {
    document.querySelectorAll(".particles").forEach(function (wrap) {
      var n = prefersReducedMotion ? 8 : 18;
      for (var i = 0; i < n; i++) {
        var p = document.createElement("span");
        p.className = "particle";
        p.style.left = Math.random() * 100 + "%";
        p.style.top = Math.random() * 100 + "%";
        p.style.animationDelay = -Math.random() * 10 + "s";
        wrap.appendChild(p);
      }
    });
  }

  /* ——— Floating labels / select ——— */
  function initFloatFields() {
    document.querySelectorAll(".float-field").forEach(function (field) {
      var input = field.querySelector("input, textarea, select");
      if (!input) return;
      function upd() {
        if (input.tagName === "SELECT") {
          field.classList.toggle("is-filled", input.value !== "");
        }
      }
      input.addEventListener("change", upd);
      input.addEventListener("input", upd);
      upd();
    });
  }

  /* ——— Form ——— */
  function initForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("form-status");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (inp) {
        var wrap = inp.closest(".float-field");
        var empty = inp.tagName === "SELECT" ? inp.value === "" : !inp.value.trim();
        if (empty) {
          ok = false;
          if (wrap) wrap.classList.add("is-invalid");
        } else if (wrap) wrap.classList.remove("is-invalid");
      });
      var email = form.querySelector('[name="email"]');
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        ok = false;
        var ew = email.closest(".float-field");
        if (ew) ew.classList.add("is-invalid");
      }

      if (!ok) {
        if (status) {
          status.textContent = "Please complete all required fields correctly.";
          status.classList.remove("hidden");
          status.classList.add("text-red-400");
        }
        return;
      }

      var btn = document.getElementById("form-submit");
      if (btn) btn.disabled = true;

      setTimeout(function () {
        form.reset();
        document.querySelectorAll(".float-field").forEach(function (f) {
          f.classList.remove("is-filled", "is-invalid");
        });
        if (btn) btn.disabled = false;
        if (status) {
          status.innerHTML =
            '<span class="form-success inline-flex items-center gap-2 text-emerald-400"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Thank you — we will respond within two business days.</span>';
          status.classList.remove("hidden", "text-red-400");
        }
      }, 900);
    });
  }

  /* ——— Back to top ——— */
  function initBackTop() {
    var btn = document.getElementById("back-top");
    if (!btn) return;
    function u() {
      btn.classList.toggle("is-visible", window.scrollY > 500);
    }
    window.addEventListener("scroll", u, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
    u();
  }

  /* ——— Anchor scroll ——— */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id === "#") return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* ——— Checkout Flow ——— */
  function initCheckout() {
    const API_BASE = 'https://pay.vorynex.in/api/v1.0/phonePe/payment';
    const checkoutModal = document.getElementById('checkout-modal');
    const comingSoonModal = document.getElementById('coming-soon-modal');
    const checkoutForm = document.getElementById('checkout-form');
    
    if (!checkoutModal || !comingSoonModal) return;

    const planData = {
      'Web Starter': {
        price: 1,
        desc: 'Essential digital presence',
        features: ['Professional Website', '1 Custom Domain', '12 Months Hosting', '6 Months Support', 'Basic SEO']
      },
      'Business Growth': {
        price: 1,
        desc: 'Advanced tools & mobile integration',
        features: ['Premium Web + Android App', '2 Custom Domains', '24 Months Hosting', '12 Months Support', 'Play Store Publishing', 'Social Marketing']
      },
      'Enterprise Suite': {
        price: 1,
        desc: 'Ultimate enterprise business suite',
        features: ['Enterprise Web + Native App', '5 Custom Domains', '24 Months Hosting Included', '24 Months Dedicated Support', 'ASO & Full Marketing', 'AI Automation Tools']
      }
    };

    const openCheckout = (planName) => {
      const data = planData[planName] || planData['Web Starter'];
      const price = data.price;
      
      document.getElementById('summary-plan-name').textContent = planName;
      document.getElementById('summary-plan-desc').textContent = data.desc;
      document.getElementById('summary-plan-price').textContent = '₹' + price.toLocaleString();
      document.getElementById('summary-subtotal').textContent = '₹' + price.toLocaleString();
      document.getElementById('summary-total').textContent = '₹' + price.toLocaleString();

      const featureList = document.getElementById('summary-plan-features');
      if (featureList) {
        featureList.innerHTML = data.features.map(f => `
          <li class="flex items-center gap-2">
            <svg class="h-3 w-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
            ${f}
          </li>
        `).join('');
      }
      
      const checkoutBtn = document.getElementById('final-checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.textContent = `Checkout • ₹${price.toLocaleString()}`;
      }

      checkoutModal.classList.remove('hidden');
      checkoutModal.classList.add('flex');
      document.body.style.overflow = 'hidden'; // Prevent scroll
    };

    const closeCheckout = () => {
      checkoutModal.classList.add('hidden');
      checkoutModal.classList.remove('flex');
      document.body.style.overflow = ''; // Restore scroll
    };

    const closeComingSoon = () => {
      comingSoonModal.classList.add('hidden');
      comingSoonModal.classList.remove('flex');
    };

    // Open checkout on Buy Now click
    document.querySelectorAll('.checkout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.getAttribute('data-plan');
        openCheckout(plan);
      });
    });

    // Close buttons
    document.getElementById('close-checkout')?.addEventListener('click', closeCheckout);
    document.getElementById('close-coming-soon')?.addEventListener('click', closeComingSoon);
    
    // Final Checkout Action (PhonePe Integration)
    const finalCheckoutBtn = document.getElementById('final-checkout-btn');
    const paymentLoader = document.getElementById('payment-loader');
    const successModal = document.getElementById('payment-success-modal');
    const failedModal = document.getElementById('payment-failed-modal');
    const retryBtn = document.getElementById('retry-payment-btn');

    // AUTO-VERIFY ON PAGE LOAD (Handles redirect back from PhonePe)
    const checkPaymentStatus = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('merchantorderid') || urlParams.get('merchantOrderId') || 
                      urlParams.get('orderId') || urlParams.get('transactionId');
      
      if (orderId) {
        // Clear URL params to avoid re-verification on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        
        paymentLoader.classList.remove('hidden');
        paymentLoader.classList.add('flex');
        await verifyOrder(orderId);
      }
    };

    const handlePayment = async () => {
      // Validate form
      let ok = true;
      let formData = {};
      
      checkoutForm.querySelectorAll('[required]').forEach(inp => {
        const wrap = inp.closest('.float-field');
        if (!inp.value.trim()) {
          ok = false;
          wrap?.classList.add('is-invalid');
        } else {
          wrap?.classList.remove('is-invalid');
          formData[inp.name] = inp.value.trim();
        }
      });

      const email = checkoutForm.querySelector('[name="email"]');
      if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        ok = false;
        email.closest('.float-field')?.classList.add('is-invalid');
      }

      if (!ok) return;

      // Prevent double click
      finalCheckoutBtn.disabled = true;
      paymentLoader.classList.remove('hidden');
      paymentLoader.classList.add('flex');

      try {
        const planName = document.getElementById('summary-plan-name').textContent;
        const amountStr = document.getElementById('summary-total').textContent.replace(/[^\d]/g, '');
        const amountPaisa = parseInt(amountStr) * 100;
        
        // Generate a merchantOrderId if not provided
        const mOrderId = `VNX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // 1. Create Payment API
        const response = await fetch(`${API_BASE}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: amountPaisa,
            email: formData.email || "",
            phoneno: formData.phone || "",
            merchantorderid: mOrderId,
            plan: planName
          })
        });

        if (!response.ok) throw new Error('Failed to create payment session');
        const data = await response.json(); // { orderId, token, state }

        if (!data.orderId && !data.merchantorderid) {
            throw new Error('Invalid response from payment server: Missing Order ID');
        }
        
        if (!data.redirectUrl && !data.token) {
            throw new Error('Invalid response from payment server: Missing Redirect URL or Token');
        }

        // 2. Open PhonePe Checkout
        console.log('Backend Response:', data);
        
        // Store merchantOrderId locally
        const mid = data.merchantorderid || data.merchantOrderId;
        if (mid) localStorage.setItem('vorynex_last_mid', mid);

        if (data.redirectUrl) {
            console.log('Redirecting to Payment Gateway:', data.redirectUrl);
            window.location.href = data.redirectUrl;
        } else if (window.PhonePeCheckout) {
          try {
            window.PhonePeCheckout.transact({
              tokenUrl: data.token,
              callback: (res) => {
                console.log('PhonePe SDK Callback:', res);
                if (res === 'CONCLUDED' || res === 'SUCCESS') {
                  verifyOrder(data.orderId);
                } else if (res === 'USER_CANCEL') {
                  showFailed();
                }
              },
              type: "REDIRECT"
            });
          } catch (e) {
            console.warn('SDK Transact failed, falling back to manual redirect');
            if (data.token && data.token.startsWith('http')) window.location.href = data.token;
            else showFailed();
          }
        } else {
          console.error('No redirectUrl found in response and SDK not available');
          showFailed();
        }

      } catch (err) {
        console.error('Checkout error:', err);
        showFailed();
      }
    };

    const verifyOrder = async (orderId) => {
      try {
        const response = await fetch(`${API_BASE}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: orderId }) // Send merchantOrderId value as 'orderId' key
        });

        const result = await response.json();

        if (result.status === 'SUCCESS') {
          showSuccess(orderId);
        } else {
          showFailed();
        }
      } catch (err) {
        console.error('Verification error:', err);
        showFailed();
      }
    };

    const showSuccess = (orderId) => {
      paymentLoader.classList.add('hidden');
      paymentLoader.classList.remove('flex');
      document.getElementById('success-txid').textContent = orderId;
      successModal.classList.remove('hidden');
      successModal.classList.add('flex');
    };

    const showFailed = () => {
      paymentLoader.classList.add('hidden');
      paymentLoader.classList.remove('flex');
      finalCheckoutBtn.disabled = false;
      failedModal.classList.remove('hidden');
      failedModal.classList.add('flex');
    };

    finalCheckoutBtn?.addEventListener('click', handlePayment);
    retryBtn?.addEventListener('click', () => {
      failedModal.classList.add('hidden');
      handlePayment();
    });

    // Check status on load
    checkPaymentStatus();

    // Close on overlay click for coming soon
    document.getElementById('coming-soon-overlay')?.addEventListener('click', closeComingSoon);
  }

  ready(function () {
    initLoader();
    initScrollProgress();
    initNav();
    initCursorGlow();
    initMagnetic();
    initRipple();
    initReveal();
    initParallax();
    initCounters();
    initTimeline();
    initServiceCards();
    initParticles();
    initFloatFields();
    initForm();
    initBackTop();
    initAnchors();
    initCheckout();
  });
})();
