# -*- coding: utf-8 -*-
"""
ساخت عکس‌های وب از فایل‌های اصلیِ تولیدشده با نانو بنانا.

این اسکریپت سه کار می‌کند:
  ۱. واترمارک ✦ جمنای را از گوشه‌ی پایین-راست پاک می‌کند
  ۲. در صورت نیاز، عکس را به نسبت تصویر موردنیاز برش می‌زند
  ۳. برای وب فشرده و ذخیره می‌کند

اجرا:  python build-images.py
هر وقت عکس جدیدی از نانو بنانا گرفتی، مسیرش را به لیست PICKS اضافه کن
و دوباره اجرا کن.
"""
from PIL import Image, ImageFilter, ImageChops
import os

SRC = r'F:\claude\projects\website\new-web\pictures'
OUT = r'F:\claude\projects\website\new-web\demo\assets\img'


def kill_watermark(im):
    """واترمارک ✦ جمنای را از گوشه‌ی پایین-راست پاک می‌کند.

    روش: به‌جای پوشاندنِ کورِ کل گوشه (که ردِ مستطیلی می‌گذاشت)،
    فقط خودِ پیکسل‌های واترمارک را پیدا و ترمیم می‌کنیم:
      ۱. یک نسخه‌ی میانه‌گیری‌شده می‌سازیم = تخمینِ «پس‌زمینه بدون واترمارک»
      ۲. هرجا عکس اصلی به‌طور محسوسی روشن‌تر از این تخمین بود = واترمارک
      ۳. فقط همان نقاط با مقدار پس‌زمینه جایگزین می‌شوند
    نتیجه: جزئیات واقعی (پایه‌ی صندلی، سایه‌ها) دست‌نخورده می‌مانند.
    """
    W, H = im.size
    bw, bh = int(W * 0.22), int(H * 0.22)
    x0, y0 = W - bw, H - bh
    box = (x0, y0, W, H)

    corner = im.crop(box)
    bg = corner.filter(ImageFilter.MedianFilter(size=9))   # تخمین پس‌زمینه

    # ماسک: نقاطی که از پس‌زمینه روشن‌ترند
    diff = ImageChops.subtract(corner.convert('L'), bg.convert('L'))
    mask = diff.point(lambda p: 255 if p > 8 else 0)
    mask = mask.filter(ImageFilter.MaxFilter(5))           # کمی گشادش می‌کنیم
    mask = mask.filter(ImageFilter.GaussianBlur(2))        # لبه‌ها را نرم می‌کند

    im.paste(Image.composite(bg, corner, mask), box)
    return im


def build(src, name, width, ratio=None, anchor=0.5):
    im = Image.open(os.path.join(SRC, src)).convert('RGB')
    im = kill_watermark(im)

    if ratio:                                     # برش به نسبت تصویر دلخواه
        W, H = im.size
        th = int(W / ratio)
        if th <= H:
            top = int((H - th) * anchor)
            im = im.crop((0, top, W, top + th))
        else:
            tw = int(H * ratio)
            left = (W - tw) // 2
            im = im.crop((left, 0, left + tw, H))

    im.thumbnail((width, width * 3), Image.LANCZOS)
    path = os.path.join(OUT, name + '.jpg')
    im.save(path, quality=82, optimize=True, progressive=True)
    print(name.ljust(20), str(im.size).ljust(14),
          str(round(os.path.getsize(path) / 1024)) + 'KB')


PICKS = [
    # --- فریم ۱ : کولاژ پراکنده ---
    (r'FRAME 1\New folder\Gemini_Generated_Image_dgd0skdgd0skdgd0.png',        'f1-cream',   760),
    (r'FRAME 1\New folder (2)\Gemini_Generated_Image_7uvn4l7uvn4l7uvn.png',    'f1-olive',   900),
    (r'FRAME 1\New folder (3)\Gemini_Generated_Image_88zvkf88zvkf88zv.png',    'f1-yellow',  880),
    (r'FRAME 1\New folder (4)\Gemini_Generated_Image_4tj0y74tj0y74tj0 (1).png','f1-suede',   560),
    (r'FRAME 1\New folder (5)\Gemini_Generated_Image_auzh33auzh33auzh.png',    'f1-teal',    820),

    # --- فریم ۲ : بنر زرشکی ---
    (r'FRAME 2\Gemini_Generated_Image_e0125te0125te012.png', 'f2-bg',    2000, 21/9, 0.30),
    (r'FRAME 2\Gemini_Generated_Image_dsjd95dsjd95dsjd.png', 'f2-inset',  700, 3/4,  0.00),

    # --- فریم ۳ : بنر آشپزخانه ---
    (r'FRAME 3\Gemini_Generated_Image_ycmpbfycmpbfycmp.png', 'f3-bg',    2000, 21/9, 0.35),
    (r'FRAME 3\Gemini_Generated_Image_lpkkkrlpkkkrlpkk.png', 'f3-inset',  700, 3/4,  0.00),

    # --- فریم ۴ : بنر اُخرایی ---
    (r'FRAME 4\Gemini_Generated_Image_nzwbownzwbownzwb.png', 'f4-bg',    2000, 21/9, 0.30),
    (r'FRAME 4\Gemini_Generated_Image_wzz56ewzz56ewzz5.png', 'f4-inset',  700, 3/4,  0.00),

    # --- فریم ۵ : صحنه‌های محصول ---
    (r'FRAME 5\P (8)\Gemini_Generated_Image_55z4fr55z4fr55z4.png', 'hero-tehran',       2000),
    (r'FRAME 5\P\Gemini_Generated_Image_4sgfz54sgfz54sgf.png',     'kitchen-seaside',   1200),
    (r'FRAME 5\P (3)\Gemini_Generated_Image_e5i8ise5i8ise5i8.png', 'khorramshahr',      1200),
    (r'FRAME 5\P (5)\Gemini_Generated_Image_5so6bw5so6bw5so6.png', 'apartment-leather', 1200),
    (r'FRAME 5\P (7)\Gemini_Generated_Image_kxdxawkxdxawkxdx.png', 'bar-wood',          1200),
    (r'FRAME 3\Gemini_Generated_Image_495g2b495g2b495g.png',       'kitchen-wide',      2000),
    (r'FRAME 2\Gemini_Generated_Image_dsjd95dsjd95dsjd.png',       'portrait-maroon',   1100),
    (r'FRAME 4\Gemini_Generated_Image_fzcwv1fzcwv1fzcw.png',       'detail-gold',       1100),
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for row in PICKS:
        build(*row)
    print('\nتمام شد.')
