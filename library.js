(function() {
  try {
    // 1. قراءة المعاملات من URL الصفحة الحالية
    const urlParams = new URLSearchParams(window.location.search);
    
    // 2. جلب الشعار مباشرة من الرابط
    const logoUrl = urlParams.get('game_logo');
    
    if (!logoUrl) {
      console.warn('Library.js: Missing "game_logo" parameter in page URL');
      return;
    }
    
    console.log('Library.js: Applying logo from URL parameter:', logoUrl);

    // --- دالة مساعدة لتطبيق الشعار على عنصر محدد ---
    const applyLogoToElement = (el) => {
      // التأكد من أن 'el' هو عنصر HTML صالح قبل استخدام 'matches'
      if (!el || typeof el.matches !== 'function') {
        return;
      }

      // قائمة بجميع المحددات (selectors) التي نعتبرها "شعار"
      const isLogoElement = el.matches([
        'img.logo',
        '[data-role="logo"]',
        'img[src*="logo" i]',  // صور تحتوي كلمة "logo" في المصدر
        'img[alt*="logo" i]',  // صور تحتوي كلمة "logo" في النص البديل
        '[id*="logo" i]'      // أي عنصر يحتوي "logo" في الـ ID
      ].join(', '));

      // إذا لم يكن العنصر مطابقاً، نتوقف
      if (!isLogoElement) {
        return;
      }

      // 3. تطبيق الشعار
      if (el.tagName === 'IMG') {
        // إذا كان صورة، نغير المصدر (src)
        if (el.src !== logoUrl) {
          el.src = logoUrl;
          console.log('Library.js: Forced IMG src update:', el);
        }
      } else {
        // إذا كان عنصراً آخر (مثل div)، نغير خلفية (background-image)
        const newBgImage = `url("${logoUrl}")`;
        if (el.style.backgroundImage !== newBgImage) {
          el.style.backgroundImage = newBgImage;
          el.style.backgroundSize = 'contain';
          el.style.backgroundRepeat = 'no-repeat';
          el.style.backgroundPosition = 'center';
          console.log('Library.js: Forced background-image update:', el);
        }
      }
    };

    // --- 4. البحث الأولي عن الشعارات الموجودة حالياً ---
    // هذا يضمن تغيير الشعارات التي تم تحميلها قبل تشغيل السكربت
    const initialSelectors = [
      'img.logo',
      '[data-role="logo"]',
      'img[src*="logo" i]',
      'img[alt*="logo" i]',
      '[id*="logo" i]'
    ].join(', ');

    document.querySelectorAll(initialSelectors).forEach(applyLogoToElement);

    // --- 5. بدء المراقبة (هذا هو الجزء "مرارا وتكرارا") ---
    // ننشئ مراقب لاكتشاف أي تغييرات في الصفحة
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        
        // أ) عند إضافة عناصر جديدة للصفحة
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // التحقق من العنصر المضاف نفسه
              applyLogoToElement(node);
              // التحقق من جميع العناصر داخل العنصر المضاف
              // (مفيد إذا تم إضافة كتلة HTML كاملة)
              node.querySelectorAll(initialSelectors).forEach(applyLogoToElement);
            }
          });
        }
        
        // ب) عند تغيير سمات (attributes) عنصر موجود
        // هذا يضمن "فرض" الشعار إذا حاولت الصفحة تغييره
        if (mutation.type === 'attributes') {
          applyLogoToElement(mutation.target);
        }
      }
    });

    // بدء المراقبة على كامل الصفحة (document.body)
    observer.observe(document.body || document.documentElement, {
      childList: true, // راقب إضافة/إزالة عناصر
      subtree: true,   // راقب جميع العناصر الفرعية
      attributes: true, // راقب تغيير السمات
      attributeFilter: ['src', 'alt', 'id', 'class', 'data-role'] // ركز على السمات المتعلقة بالشعار
    });

    console.log('Library.js: Logo observer started.');

    // --- 6. إضافة معلومات أولية إلى النافذة (بدون data.json) ---
    // نقوم بقراءة باقي المعلومات من الرابط أيضاً
    const playerId = urlParams.get('player_id') || urlParams.get('player');
    const gameId = urlParams.get('game_id') || urlParams.get('game');
    const gameName = urlParams.get('game_name'); // اسم اللعبة من الرابط

    window.gameLibrary = {
      player: { id: playerId },
      game: { id: gameId, name: gameName || 'Game' },
      logo: logoUrl
    };

    // إطلاق حدث مخصص عند انتهاء تحميل المكتبة
    window.dispatchEvent(new CustomEvent('libraryLoaded', {
      detail: {
        playerId: playerId,
        gameId: gameId,
        logoUrl: logoUrl
      }
    }));

  } catch (error) {
    console.error('Library.js: Error loading library', error);
  }
})();