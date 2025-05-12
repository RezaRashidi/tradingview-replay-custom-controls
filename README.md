# TradingView Custom Replay Controls
This Userscript provides additional controls for more precise date and time selection in TradingView's "Bar Replay" mode.
## Features
* **Custom Date Input:** A text field to directly enter the date in `YYYY-MM-DD` format.
    * Default Date: `2024-01-03`
* **Custom Time Input:** A field to select or enter the time.
    * Default Time: `17:30`
* **"Go To" Button:** Applies the date and time entered in the custom fields to TradingView's replay mode.
* **"Next Day" Button:** Advances the replay date to the next day while keeping the previously set time. The custom date input field is also updated.
* **Advanced Calendar Navigation:** When setting the date, the script attempts to navigate through TradingView's own calendar's month and year selection views.
* **Time Selection from List:** For time selection, the script simulates a Tab key press to focus the time field (which should open the time dropdown), and then clicks the desired time item from the list.
## Requirements
* A web browser (e.g., Chrome, Firefox, Edge)
* A Userscript manager extension like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/) (for Firefox).
## Installation
1.  Ensure Tampermonkey (or a similar extension) is installed and enabled in your browser.
2.  Go to the script's page on [Distribution Platform, e.g., GreasyFork or GitHub Gist].
3.  Click the "Install this script" button (or similar).
4.  The Tampermonkey installation page will open. Click "Install".
## How to Use
1.  Navigate to [TradingView](https://www.tradingview.com/) and open a chart.
2.  Activate the "Bar Replay" mode.
3.  The new custom controls (date input, time input, "Go To" button, "Next Day" button) should appear in the Replay controls bar.
4.  Enter your desired date in the date input field using `YYYY-MM-DD` format.
5.  Enter or select your desired time in the time input field.
6.  Click the "Go To" button to jump to that date and time in the replay.
7.  Use the "Next Day" button to advance to the subsequent day.
## Notes & Potential Issues
* **Delays:** The script uses very short delays between operations for speed. If you experience issues on your system where the script fails or errors out (e.g., elements not found), you might need to slightly increase the `DELAY_...` constant values at the beginning of the script code.
* **Dependency on HTML Structure:** This script relies on the current HTML structure and CSS classes of TradingView. If TradingView updates its website and these structures change, the script may break and require an update.
* **Time Selection:** Correct time selection depends on TradingView opening its time dropdown list when the time input field receives focus via a simulated Tab key press.
* **Calendar Navigation:** The advanced calendar navigation (selecting year/month from different views) is implemented based on the current structure of TradingView's calendar. Changes to this structure may affect this functionality.
## Contributing
If you have suggestions for improvement or find any issues, please report them via the Issues section (on GitHub).

# کنترل‌های سفارشی Replay برای TradingView
این Userscript کنترل‌های اضافی برای انتخاب دقیق‌تر تاریخ و زمان در حالت "Bar Replay" وب‌سایت TradingView فراهم می‌کند.
## ویژگی‌ها
* **ورودی تاریخ سفارشی:** یک کادر متنی برای وارد کردن مستقیم تاریخ با فرمت `YYYY-MM-DD`.
    * تاریخ پیش‌فرض: `2024-01-03`
* **ورودی زمان سفارشی:** یک کادر برای انتخاب یا وارد کردن زمان.
    * زمان پیش‌فرض: `17:30`
* **دکمه "برو به":** تاریخ و زمان وارد شده در کادرهای سفارشی را در حالت Replay تریدینگ‌ویو اعمال می‌کند.
* **دکمه "روز بعد":** تاریخ Replay را به روز بعد با حفظ همان زمان قبلی منتقل می‌کند. فیلد تاریخ سفارشی نیز با تاریخ جدید آپدیت می‌شود.
* **ناوبری پیشرفته در تقویم:** هنگام تنظیم تاریخ، اسکریپت سعی می‌کند از طریق نماهای انتخاب ماه و سال در تقویم خود TradingView به تاریخ مورد نظر برود.
* **انتخاب زمان از لیست:** برای انتخاب زمان، اسکریپت ابتدا با شبیه‌سازی کلید Tab فوکوس را به فیلد زمان منتقل می‌کند (که باید لیست کشویی زمان را باز کند) و سپس آیتم زمان مورد نظر را از لیست انتخاب می‌کند.
## نیازمندی‌ها
* مرورگر وب (مانند Chrome, Firefox, Edge)
* افزونه مدیریت Userscript مانند [Tampermonkey](https://www.tampermonkey.net/) یا [Greasemonkey](https://www.greasespot.net/) (برای فایرفاکس).
## نصب
1.  مطمئن شوید که افزونه Tampermonkey (یا مشابه) روی مرورگر شما نصب و فعال است.
2.  به صفحه این اسکریپت در [محل انتشار، مثلاً GreasyFork یا GitHub Gist] بروید.
3.  روی دکمه "Install this script" یا مشابه آن کلیک کنید.
4.  صفحه نصب Tampermonkey باز می‌شود. روی دکمه "Install" کلیک کنید.
## نحوه استفاده
1.  به وب‌سایت [TradingView](https://www.tradingview.com/) بروید و یک چارت را باز کنید.
2.  حالت "Bar Replay" را فعال کنید.
3.  کنترل‌های سفارشی جدید (کادر تاریخ، کادر زمان، دکمه "برو به"، دکمه "روز بعد") باید در نوار کنترل Replay ظاهر شوند.
4.  تاریخ مورد نظر خود را با فرمت `YYYY-MM-DD` در کادر تاریخ وارد کنید.
5.  زمان مورد نظر را در کادر زمان وارد یا انتخاب کنید.
6.  روی دکمه "برو به" کلیک کنید تا به آن تاریخ و زمان در Replay بروید.
7.  از دکمه "روز بعد" برای پرش به روز بعد استفاده کنید.
## نکات و مشکلات احتمالی
* **تاخیرها:** اسکریپت از تاخیرهای بسیار کمی بین عملیات استفاده می‌کند تا سریع باشد. اگر در سیستم شما اسکریپت به درستی کار نمی‌کند یا خطا می‌دهد (مثلاً عنصری پیدا نمی‌شود)، ممکن است لازم باشد مقادیر ثابت‌های `DELAY_...` را در ابتدای کد اسکریپت کمی افزایش دهید.
* **وابستگی به ساختار HTML:** این اسکریپت به ساختار HTML و کلاس‌های CSS فعلی TradingView وابسته است. اگر TradingView سایت خود را به‌روزرسانی کند و این ساختارها تغییر کنند، ممکن است اسکریپت از کار بیفتد و نیاز به آپدیت داشته باشد.
* **انتخاب زمان:** عملکرد صحیح انتخاب زمان به این بستگی دارد که پس از انتقال فوکوس به فیلد زمان (با شبیه‌سازی Tab)، لیست کشویی زمان توسط TradingView باز شود.
* **ناوبری تقویم:** ناوبری پیشرفته در تقویم (انتخاب سال/ماه از نماهای مختلف) بر اساس ساختار فعلی تقویم TradingView پیاده‌سازی شده است. تغییرات در این ساختار ممکن است روی این بخش تأثیر بگذارد.
## مشارکت
اگر پیشنهادی برای بهبود دارید یا مشکلی پیدا کردید، لطفاً از طریق بخش Issues (در گیت‌هاب) اطلاع دهید.
