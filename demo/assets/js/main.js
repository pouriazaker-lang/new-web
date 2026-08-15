/* ============================================================
   OPENTOP — ENGINE
   کل انیمیشن‌های سایت با همین یک فایل کار می‌کنه.
   بدون هیچ کتابخانه‌ی بیرونی (نه jQuery، نه GSAP) — سبک و سریع.
   ============================================================ */
(function () {
  'use strict';

  /* --------------------------------------------------------
     ۱. آماده‌سازی متن‌ها برای انیمیشن
     متن رو به خط یا حرف تقسیم می‌کنیم تا بشه
     تک‌تکشون رو با تأخیر پشت سر هم انیمیت کرد.
     -------------------------------------------------------- */

  // تقسیم به خط: هر خط داخل یک «ماسک» قرار می‌گیره
  function splitLines(el) {
    var lines = el.getAttribute('data-lines').split('|');
    el.innerHTML = lines.map(function (line, i) {
      return '<span class="line-mask"><span class="line-in" style="--i:' + i + '">' +
             line.trim() + '</span></span>';
    }).join('');
  }

  /* تقسیم به حرف
     ⚠️ هشدار مهم برای متن فارسی:
     خط فارسی/عربی «چسبان» است — حروف به هم می‌چسبند.
     اگر هر حرف را داخل یک span جدا بگذاریم، اتصال حروف می‌شکند
     و مثلاً «سلام» تبدیل می‌شود به «س ل ا م».
     بنابراین این افکت فقط روی متن لاتین (مثل OPEN TOP) استفاده می‌شود.
     برای متن فارسی از .r-lines (خط‌به‌خط) یا .r-fade استفاده کنید.
     تابع زیر خودش هم این را چک می‌کند و در صورت دیدن حرف فارسی
     به‌جای شکستن، کل متن را یک‌جا انیمیت می‌کند. */
  function splitChars(el) {
    var text = el.textContent.trim();

    if (/[؀-ۿ]/.test(text)) {         // متن فارسی/عربی تشخیص داده شد
      el.classList.remove('r-chars');
      el.classList.add('r-fade');               // به افکت امن سوییچ می‌کنیم
      return;
    }

    var out = '', n = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { out += ' '; continue; }
      out += '<span class="char" style="--i:' + (n++) + '">' + ch + '</span>';
    }
    el.innerHTML = out;
  }

  document.querySelectorAll('.r-lines[data-lines]').forEach(splitLines);
  document.querySelectorAll('.r-chars').forEach(splitChars);

  // شماره‌گذاری آیتم‌های گروهی (برای تأخیر پلکانی)
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  /* --------------------------------------------------------
     ۲. سیستم ریویل
     وقتی عنصر وارد صفحه شد، کلاس is-revealed می‌گیره.
     بقیه‌ی کار (خود انیمیشن) با CSS انجام می‌شه.
     -------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(
    '.r-media, .r-lines, .r-chars, .r-fade, .r-line, .m-materials__sw'
  );

  /* ⚠️ نکته‌ی فنی مهم (یک بن‌بست واقعی که در تست کشف شد):
     عنصرهای .r-media در حالت اولیه با clip-path به مساحت صفر جمع شده‌اند.
     IntersectionObserver مساحتِ دیده‌شده را می‌سنجد — و مساحت صفر یعنی
     «هرگز وارد صفحه نشده». پس کلاس is-revealed اضافه نمی‌شود،
     پس clip باز نمی‌شود، پس مساحت صفر می‌ماند... حلقه‌ی بی‌پایان.
     راه‌حل: به‌جای خودِ عنصرِ کلیپ‌شده، «قابِ بیرونیِ» آن را رصد می‌کنیم
     (که هیچ‌وقت کلیپ نمی‌شود) و کلاس را روی فرزند می‌گذاریم. */
  if ('IntersectionObserver' in window) {
    var watchMap = new WeakMap();          // عنصرِ رصدشده → عنصرهایی که باید ریویل شوند

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var targets = watchMap.get(entry.target) || [entry.target];
        targets.forEach(function (t) { t.classList.add('is-revealed'); });
        io.unobserve(entry.target);        // یک‌بار اجرا، بعد رها می‌کنیم
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'        // کمی زودتر از رسیدن به وسط صفحه
    });

    revealTargets.forEach(function (el) {
      // فقط عنصرهای کلیپ‌شده نیاز به «نماینده» دارند؛ بقیه خودشان رصد می‌شوند
      var watch = el.classList.contains('r-media') && el.parentElement
                    ? el.parentElement : el;

      if (!watchMap.has(watch)) { watchMap.set(watch, []); io.observe(watch); }
      watchMap.get(watch).push(el);
    });
  } else {
    // مرورگرهای خیلی قدیمی: همه چیز مستقیم نمایش داده می‌شه
    revealTargets.forEach(function (el) { el.classList.add('is-revealed'); });
  }

  /* --------------------------------------------------------
     ۳. پارالاکس
     عناصری که data-speed دارن، موقع اسکرول با سرعت
     متفاوتی حرکت می‌کنن → حس عمق ایجاد می‌شه.
     همه‌ی محاسبات داخل requestAnimationFrame انجام می‌شه
     که اسکرول کند نشه.
     -------------------------------------------------------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
  var vh = window.innerHeight;
  var ticking = false;

  function applyParallax() {
    for (var i = 0; i < parallaxEls.length; i++) {
      var el = parallaxEls[i];
      var rect = el.getBoundingClientRect();

      // خارج از دید؟ رد شو (صرفه‌جویی در پردازش)
      if (rect.bottom < -200 || rect.top > vh + 200) continue;

      var speed = parseFloat(el.getAttribute('data-speed'));
      // میزان پیشروی عنصر در ویوپورت: از 1- تا 1
      var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      el.style.transform = 'translate3d(0,' + (progress * speed * 100).toFixed(2) + 'px,0)';
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) { requestAnimationFrame(applyParallax); ticking = true; }
  }

  /* --------------------------------------------------------
     ۴. رفتار هدر
     - بعد از عبور از هیرو: پس‌زمینه سفید می‌گیره
     - اسکرول به پایین: مخفی می‌شه
     - اسکرول به بالا: برمی‌گرده
     -------------------------------------------------------- */
  var header = document.querySelector('.m-header');
  var lastY = 0;

  function onHeader() {
    var y = window.pageYOffset;
    var passedHero = y > vh * 0.85;

    header.classList.toggle('is-stuck', passedHero);
    header.classList.toggle('m-header--over', !passedHero);

    // مخفی‌شدن فقط وقتی به‌اندازه‌ی کافی پایین رفتیم
    if (y > lastY && y > vh * 0.9) header.classList.add('is-hidden');
    else header.classList.remove('is-hidden');

    lastY = y;
  }

  window.addEventListener('scroll', function () { onScroll(); onHeader(); }, { passive: true });
  window.addEventListener('resize', function () { vh = window.innerHeight; applyParallax(); });

  /* --------------------------------------------------------
     ۵. لودر ورودی
     -------------------------------------------------------- */
  var loader = document.querySelector('.m-loader');

  window.addEventListener('load', function () {
    applyParallax();
    onHeader();

    setTimeout(function () { loader.classList.add('is-in'); }, 60);
    setTimeout(function () { loader.classList.add('is-out'); }, 1100);
    setTimeout(function () {
      loader.classList.add('is-done');
      document.body.classList.remove('is-locked');
      // ریویل ماژول اول بعد از رفتن پرده اجرا می‌شه
      document.querySelectorAll('.m-hero .r-media, .m-hero .r-lines, .m-hero .r-fade')
        .forEach(function (el) { el.classList.add('is-revealed'); });
    }, 2200);
  });

})();
