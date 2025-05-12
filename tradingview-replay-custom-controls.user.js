// ==UserScript==
// @name         TradingView Custom Replay Controls - Final User Version
// @namespace    http://tampermonkey.net/
// @version      2.7.0
// @description  Adds custom date/time controls for TradingView Replay. Uses advanced calendar navigation & fast Tab-to-Time. Default Date: 2024-01-03, Default Time: 17:30.
// @author       You & Gemini
// @match        https://*.tradingview.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- Delay Constants (User Specified - Very Fast) ---
    const DELAY_UI_ACTION = 50;       // General UI action
    const DELAY_FOCUS_SHIFT = 10;      // Focus changes, short waits
    const DELAY_DROPDOWN_LOAD = 50;   // Waiting for dropdown (critical, may need increase if issues)
    const DELAY_DIALOG_OPEN = 50;     // Timeout for main dialog to open
    const DELAY_CALENDAR_NAV = 10;    // Between calendar navigation clicks

    // --- Selectors ---
    const DIALOG_SELECTOR = 'div[data-dialog-name="Select date"]';
    const DATE_INPUT_IN_DIALOG_SELECTOR = `${DIALOG_SELECTOR} input[placeholder="YYYY-MM-DD"]`;
    const TIME_INPUT_IN_DIALOG_SELECTOR = `${DIALOG_SELECTOR} input[maxlength="5"]`;
    const TIME_DROPDOWN_WRAPPER_SELECTOR = 'div.menuWrap-Kq3ruQo8[data-name="popup-menu-container"]';
    const SUBMIT_BUTTON_SELECTOR = `${DIALOG_SELECTOR} button[data-name="submit-button"]`;
    const REPLAY_CONTROLS_AREA_SELECTOR = '.selectDateBar-rEmcWy54';
    const TIME_DROPDOWN_ITEM_SELECTOR = (timeString) => `#desktop_time_input_item_${timeString.replace(':', '\\:')}`;

    const CALENDAR_MAIN_AREA_SELECTOR = `${DIALOG_SELECTOR} .calendar-N6r5jhbE`;
    const CALENDAR_HEADER_MAIN_TITLE_BUTTON_SELECTOR = `${CALENDAR_MAIN_AREA_SELECTOR} .header-N6r5jhbE button:not([aria-label*="Previous"]):not([aria-label*="Next"])`;
    const CALENDAR_HEADER_PREV_BUTTON_SELECTOR = `${CALENDAR_MAIN_AREA_SELECTOR} .header-N6r5jhbE button[aria-label*="Previous"]`;
    const CALENDAR_HEADER_NEXT_BUTTON_SELECTOR = `${CALENDAR_MAIN_AREA_SELECTOR} .header-N6r5jhbE button[aria-label*="Next"]`;
    const CALENDAR_DAY_VIEW_DAY_BUTTON_SELECTOR = (dateString) => `${CALENDAR_MAIN_AREA_SELECTOR} .view-month-N6r5jhbE button[data-day="${dateString}"]`;
    const CALENDAR_MONTH_VIEW_CONTAINER_SELECTOR = `${CALENDAR_MAIN_AREA_SELECTOR} div.view-year-N6r5jhbE`;
    const CALENDAR_YEAR_VIEW_CONTAINER_SELECTOR = `${CALENDAR_MAIN_AREA_SELECTOR} div.view-decades-N6r5jhbE`;

    // --- State Variables ---
    let lastSetDate = null;
    let lastSetTime = { hour: 17, minute: 30 }; // Default time 17:30

    // --- UI Elements References ---
    let customDateInput = null;
    let customTimeInput = null;

    // --- Helper: Wait for an element to appear ---
    function waitForElement(selector, timeout = 3000, baseElement = document) { // Reduced general timeout
        return new Promise((resolve, reject) => {
            console.log(`[waitForElement] Waiting for: ${selector} (Timeout: ${timeout}ms)`);
            const intervalTime = 20; let elapsedTime = 0; // Faster check
            const interval = setInterval(() => {
                const element = baseElement.querySelector(selector);
                if (element) {
                    console.log(`[waitForElement] Found: ${selector}`);
                    clearInterval(interval); resolve(element);
                } else {
                    elapsedTime += intervalTime;
                    if (elapsedTime >= timeout) {
                        clearInterval(interval);
                        console.error(`[waitForElement] Timeout: ${selector}`);
                        reject(new Error(`Timeout: ${selector}`));
                    }
                }
            }, intervalTime);
        });
    }

    // --- Helper Function: Click an element reliably ---
    function clickElement(element, description) {
        if (element && !element.disabled) {
            console.log(`در حال کلیک روی ${description}:`, element);
            element.click(); return true;
        } else {
            if (!element) console.error(`${description} پیدا نشد.`);
            else console.error(`${description} (غیرفعال).`);
            return false;
        }
    }
    function getEnglishMonthAbbreviation(monthOneBased) {
        const M_NAMES_EN_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (monthOneBased >= 1 && monthOneBased <= 12) { return M_NAMES_EN_SHORT[monthOneBased - 1]; }
        return "";
    }

    // --- Advanced Calendar Navigation Function ---
    async function selectDateInDialog_ViaAdvancedNav(dialog, targetYear, targetMonth, targetDay) {
        const targetDateString = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
        console.log(`[AdvCalNav] شروع ناوبری پیشرفته به: ${targetDateString}`);
        await new Promise(resolve => setTimeout(resolve, DELAY_UI_ACTION));

        try {
            let titleButton = await waitForElement(CALENDAR_HEADER_MAIN_TITLE_BUTTON_SELECTOR, 2000, dialog);
            let titleAriaLabel = titleButton.getAttribute('aria-label') || "";
            let titleTextElement = titleButton.querySelector('.ellipsisContainer-bYDQcOkp');
            let titleText = titleTextElement ? titleTextElement.textContent.trim() : "";

            if (titleAriaLabel.includes("Switch to months")) {
                if (!clickElement(titleButton, `دکمه عنوان (${titleText})`)) return false;
                await new Promise(resolve => setTimeout(resolve, DELAY_CALENDAR_NAV));
                titleButton = await waitForElement(CALENDAR_HEADER_MAIN_TITLE_BUTTON_SELECTOR, 2000, dialog);
                titleAriaLabel = titleButton.getAttribute('aria-label') || "";
                titleTextElement = titleButton.querySelector('.ellipsisContainer-bYDQcOkp');
                titleText = titleTextElement ? titleTextElement.textContent.trim() : "";
            }
            console.log(`[AdvCalNav] عنوان فعلی (باید سال یا دهه باشد): "${titleText}", Aria: "${titleAriaLabel}"`);

            if (titleAriaLabel.includes("Switch to years") && titleText !== String(targetYear)) {
                if (!clickElement(titleButton, `دکمه عنوان سال (${titleText})`)) return false;
                await new Promise(resolve => setTimeout(resolve, DELAY_CALENDAR_NAV));
                const maxDecadeNavAttempts = 10; let currentAttempt = 0;
                let yearSelectedInDecadeView = false;
                while (currentAttempt < maxDecadeNavAttempts && !yearSelectedInDecadeView) {
                    currentAttempt++;
                    titleButton = await waitForElement(CALENDAR_HEADER_MAIN_TITLE_BUTTON_SELECTOR, 1000, dialog);
                    const decadeTitleElement = titleButton.querySelector('.ellipsisContainer-bYDQcOkp');
                    const decadeText = decadeTitleElement ? decadeTitleElement.textContent.trim() : "";
                    const [decadeStartStr, decadeEndStr] = decadeText.split(' - ');
                    const decadeStart = parseInt(decadeStartStr), decadeEnd = parseInt(decadeEndStr);
                    console.log(`[AdvCalNav] نمای دهه: ${decadeText}. هدف: ${targetYear}`);
                    if (targetYear >= decadeStart && targetYear <= decadeEnd) {
                        const yearViewContainer = await waitForElement(CALENDAR_YEAR_VIEW_CONTAINER_SELECTOR, 1000, dialog);
                        let foundYearButton = Array.from(yearViewContainer.querySelectorAll('button.decade-button-N6r5jhbE'))
                                                 .find(btn => btn.querySelector('.ellipsisContainer-bYDQcOkp')?.textContent.trim() === String(targetYear));
                        if (foundYearButton) {
                            if (!clickElement(foundYearButton, `دکمه سال ${targetYear}`)) return false;
                            yearSelectedInDecadeView = true; await new Promise(resolve => setTimeout(resolve, DELAY_CALENDAR_NAV));
                        } else { console.error(`[AdvCalNav] سال ${targetYear} در دهه ${decadeText} پیدا نشد.`); return false; }
                    } else if (targetYear < decadeStart) {
                        if (!clickElement(dialog.querySelector(CALENDAR_HEADER_PREV_BUTTON_SELECTOR), "دهه قبل")) return false;
                        await new Promise(resolve => setTimeout(resolve, DELAY_CALENDAR_NAV));
                    } else {
                        if (!clickElement(dialog.querySelector(CALENDAR_HEADER_NEXT_BUTTON_SELECTOR), "دهه بعد")) return false;
                        await new Promise(resolve => setTimeout(resolve, DELAY_CALENDAR_NAV));
                    }
                }
                if (!yearSelectedInDecadeView) { console.error(`[AdvCalNav] انتخاب سال ${targetYear} ناموفق.`); return false; }
            } else if (titleAriaLabel.includes("Switch to years") && titleText === String(targetYear)) {
                 console.log(`[AdvCalNav] در نمای ماه برای سال ${targetYear} هستیم.`);
            } else if (!titleAriaLabel.includes("Switch to years")) {
                 console.warn(`[AdvCalNav] وضعیت نامشخص عنوان: ${titleText}, Aria: ${titleAriaLabel}`);
                 if (!titleText.includes(' - ')) return false; // Not a decade, unknown state
            }

            console.log(`[AdvCalNav] انتخاب ماه ${targetMonth} برای سال ${targetYear}...`);
            titleButton = await waitForElement(CALENDAR_HEADER_MAIN_TITLE_BUTTON_SELECTOR, 1000, dialog);
            titleTextElement = titleButton.querySelector('.ellipsisContainer-bYDQcOkp');
            titleText = titleTextElement ? titleTextElement.textContent.trim() : "";
            if (titleText !== String(targetYear)) {
                console.error(`[AdvCalNav] خطا: انتظار نمای ماه‌های ${targetYear}، اما عنوان ${titleText}.`); return false;
            }
            const targetMonthAbbr = getEnglishMonthAbbreviation(targetMonth);
            const monthViewContainer = await waitForElement(CALENDAR_MONTH_VIEW_CONTAINER_SELECTOR, 1000, dialog);
            let foundMonthButton = Array.from(monthViewContainer.querySelectorAll('button[role="cell"]'))
                                     .find(btn => btn.querySelector('.ellipsisContainer-bYDQcOkp')?.textContent.trim().toLowerCase() === targetMonthAbbr.toLowerCase());
            if (foundMonthButton) {
                if (!clickElement(foundMonthButton, `دکمه ماه ${targetMonthAbbr}`)) return false;
                await new Promise(resolve => setTimeout(resolve, DELAY_CALENDAR_NAV));
            } else { console.error(`[AdvCalNav] دکمه ماه ${targetMonthAbbr} پیدا نشد.`); return false; }

            console.log(`[AdvCalNav] انتخاب روز ${targetDay}...`);
            const dayButton = await waitForElement(CALENDAR_DAY_VIEW_DAY_BUTTON_SELECTOR(targetDateString), 1000, dialog);
            if (!clickElement(dayButton, `دکمه روز ${targetDay}`)) return false;
            await new Promise(resolve => setTimeout(resolve, DELAY_UI_ACTION));
            console.log(`[AdvCalNav] ناوبری به ${targetDateString} موفق.`); return true;
        } catch (error) { console.error("[AdvCalNav] خطا:", error); return false; }
    }

    // --- Function: Set Replay Date (Main Orchestration) ---
    async function setReplayDate(year, month, day, hour = 0, minute = 0) {
        const dialog = document.querySelector(DIALOG_SELECTOR);
        const dateDialogInput = dialog ? dialog.querySelector(DATE_INPUT_IN_DIALOG_SELECTOR) : null;
        const timeDialogInput = dialog ? dialog.querySelector(TIME_INPUT_IN_DIALOG_SELECTOR) : null;
        const submitButton = dialog ? dialog.querySelector(SUBMIT_BUTTON_SELECTOR) : null;

        if (!dialog || !dateDialogInput || !timeDialogInput || !submitButton) { console.error('عناصر اصلی دیالوگ پیدا نشدند!'); return; }

        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        const targetTimeItemSelector = TIME_DROPDOWN_ITEM_SELECTOR(timeString);
        console.log(`شروع: تاریخ ${year}-${month}-${day}, زمان ${timeString}.`);

        console.log("مرحله ۱: انتخاب تاریخ...");
        const calendarSuccess = await selectDateInDialog_ViaAdvancedNav(dialog, year, month, day);
        if (!calendarSuccess) { console.error("مرحله ۱ ناموفق."); return; }
        console.log("مرحله ۱ موفق.");
        await new Promise(resolve => setTimeout(resolve, DELAY_UI_ACTION));

        console.log("مرحله ۲: شبیه‌سازی تب از تاریخ به زمان...");
        dateDialogInput.focus(); await new Promise(resolve => setTimeout(resolve, DELAY_FOCUS_SHIFT));
        dateDialogInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true, shiftKey: false }));
        await new Promise(resolve => setTimeout(resolve, DELAY_FOCUS_SHIFT));
        timeDialogInput.focus();
        console.log("مرحله ۲ موفق: انتظار برای لیست زمان.");
        await new Promise(resolve => setTimeout(resolve, DELAY_DROPDOWN_LOAD));

        console.log(`مرحله ۳: نوشتن زمان ${timeString} در فیلد دیالوگ...`);
        timeDialogInput.value = timeString;
        timeDialogInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        timeDialogInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        console.log("مرحله ۳ موفق.");

        console.log(`مرحله ۴: انتظار و کلیک آیتم ${timeString}...`);
        try {
            const dropdownWrapper = await waitForElement(TIME_DROPDOWN_WRAPPER_SELECTOR, 3000); // Faster timeout
            const timeOptionElement = await waitForElement(targetTimeItemSelector, 1000); // Faster timeout
            timeOptionElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            await new Promise(resolve => setTimeout(resolve, DELAY_UI_ACTION));
            if (clickElement(timeOptionElement, `آیتم زمان ${timeString}`)) { console.log("مرحله ۴ موفق."); }
            else { console.warn("مرحله ۴ ناموفق (کلیک آیتم)."); timeDialogInput.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));}
        } catch (error) {
            console.warn(`مرحله ۴ ناموفق (پیدا نشدن): ${error.message}`);
            timeDialogInput.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
        }

        console.log('مرحله ۵: تاخیر قبل از کلیک تایید...');
        await new Promise(resolve => setTimeout(resolve, DELAY_UI_ACTION));

        console.log("مرحله ۶: کلیک روی دکمه تایید...");
        if (clickElement(submitButton, "دکمه تایید")) {
            console.log('مرحله ۶ موفق.');
             try {
                const dateObj = new Date(Date.UTC(year, month - 1, day, hour, minute));
                if (!isNaN(dateObj)) {
                    lastSetDate = dateObj; lastSetTime = { hour, minute };
                    console.log('وضعیت داخلی به‌روز شد:', lastSetDate.toISOString(), lastSetTime);
                    const finalDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    if (customDateInput) customDateInput.value = finalDateString;
                    if (customTimeInput) customTimeInput.value = timeString;
                } else { console.error("خطا در ایجاد شیء تاریخ."); }
            } catch (e) { console.error("خطا هنگام آپدیت وضعیت:", e); }
        } else { console.error("مرحله ۶ ناموفق."); }
    }

    // --- Function: Handle "Go To" Button Click ---
    function handleGoToClick() {
        if (!customDateInput || !customTimeInput) { return; }
        const dateValue = customDateInput.value; const timeValue = customTimeInput.value;
        if (!dateValue || !timeValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) {
             alert('فرمت تاریخ (YYYY-MM-DD) یا زمان (HH:MM) نامعتبر است.'); return;
        }
        const [year, month, day] = dateValue.split('-').map(Number);
        const [hour, minute] = timeValue.split(':').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31 ||
            isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            alert('مقادیر تاریخ یا زمان نامعتبر هستند.'); return;
        }
        if (minute % 15 !== 0) { console.warn(`دقیقه (${minute}) مضرب ۱۵ نیست.`); }
        const selectBarButton = document.querySelector('.selectDateBar__button-rEmcWy54');
        if (clickElement(selectBarButton, 'دکمه اصلی "Select bar"')) {
            setTimeout(async () => {
                 try { await setReplayDate(year, month, day, hour, minute); }
                 catch (error) { console.error("Error during setReplayDate:", error); alert("خطا در تنظیم تاریخ."); }
            }, DELAY_DIALOG_OPEN);
        } else { alert('خطا: دکمه اصلی "Select bar" پیدا نشد.'); }
    }

    // --- Function: Handle "Next Day" Button Click ---
    function handleNextDayClick() {
        let currentYear, currentMonth, currentDay;
        let currentHour = lastSetTime.hour;
        let currentMinute = lastSetTime.minute;

        if (lastSetDate) {
            currentYear = lastSetDate.getUTCFullYear();
            currentMonth = lastSetDate.getUTCMonth() + 1;
            currentDay = lastSetDate.getUTCDate();
        } else if (customDateInput && customDateInput.value && /^\d{4}-\d{2}-\d{2}$/.test(customDateInput.value)) {
            console.log("استفاده از تاریخ ورودی سفارشی برای محاسبه روز بعد.");
            [currentYear, currentMonth, currentDay] = customDateInput.value.split('-').map(Number);
            if (customTimeInput && customTimeInput.value && /^\d{2}:\d{2}$/.test(customTimeInput.value)) {
                 [currentHour, currentMinute] = customTimeInput.value.split(':').map(Number);
            }
        } else {
            alert('لطفاً ابتدا تاریخی معتبر (YYYY-MM-DD) در کادر وارد کنید یا با "برو به" تنظیم کنید.'); return;
        }

        const currentDateObj = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay));
        currentDateObj.setUTCDate(currentDateObj.getUTCDate() + 1);

        const year = currentDateObj.getUTCFullYear();
        const month = currentDateObj.getUTCMonth() + 1;
        const day = currentDateObj.getUTCDate();
        const hour = lastSetTime.hour;
        const minute = lastSetTime.minute;

        const nextDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (customDateInput) {
            customDateInput.value = nextDateString;
            console.log(`فیلد تاریخ سفارشی به (روز بعد): ${nextDateString} آپدیت شد.`);
        }
        lastSetDate = currentDateObj;

        console.log(`محاسبه روز بعد: ${year}-${month}-${day}, زمان: ${hour}:${minute}`);
        const selectBarButton = document.querySelector('.selectDateBar__button-rEmcWy54');
        if (clickElement(selectBarButton, 'دکمه اصلی "Select bar" (روز بعد)')) {
            setTimeout(async () => {
                try { await setReplayDate(year, month, day, hour, minute); }
                 catch (error) { console.error("Error during setReplayDate (Next Day):", error); alert("خطا در تنظیم تاریخ روز بعد."); }
            }, DELAY_DIALOG_OPEN);
        } else { alert('خطا: دکمه اصلی "Select bar" پیدا نشد.'); }
    }

    // --- Function: Create Custom Control Panel ---
    function createCustomControls() {
        const targetElement = document.querySelector(REPLAY_CONTROLS_AREA_SELECTOR);
        if (!targetElement || document.querySelector('.custom-replay-controls')) return;
        const parentArea = targetElement.closest('.controls-IWka22iN');
        if (!parentArea) return;
        console.log('ایجاد کنترل‌های سفارشی Replay...');
        const panel = document.createElement('div');
        panel.className = 'custom-replay-controls controls__control-IWka22iN';
        panel.style.cssText = 'display: flex; align-items: center; margin-left: 10px; gap: 6px;';

        customDateInput = document.createElement('input');
        customDateInput.type = 'text'; customDateInput.title = 'تاریخ (YYYY-MM-DD)'; customDateInput.placeholder = 'YYYY-MM-DD';
        customDateInput.value = '2024-01-03'; // Default date
        customDateInput.style.cssText = 'padding: 4px; border: 1px solid #555; border-radius: 3px; background-color: #333; color: #ddd; width: 100px; text-align: center; font-family: monospace;';

        customTimeInput = document.createElement('input');
        customTimeInput.type = 'time'; customTimeInput.title = 'انتخاب زمان (HH:MM)'; customTimeInput.step = 900;
        customTimeInput.value = `${String(lastSetTime.hour).padStart(2, '0')}:${String(lastSetTime.minute).padStart(2, '0')}`; // Default time 17:30
        customTimeInput.style.cssText = 'padding: 4px; border: 1px solid #555; border-radius: 3px; background-color: #333; color: #ddd;';

        panel.appendChild(customDateInput); panel.appendChild(customTimeInput);
        const goToButton = document.createElement('button');
        goToButton.innerText = 'برو به'; goToButton.className = 'button-D4RPB3ZC small-D4RPB3ZC black-D4RPB3ZC secondary-D4RPB3ZC';
        goToButton.style.cssText = 'padding: 4px 8px; line-height: normal;'; goToButton.onclick = handleGoToClick;
        panel.appendChild(goToButton);
        const nextDayButton = document.createElement('button');
        nextDayButton.innerText = 'روز بعد'; nextDayButton.className = 'button-D4RPB3ZC small-D4RPB3ZC black-D4RPB3ZC secondary-D4RPB3ZC';
        nextDayButton.style.cssText = 'padding: 4px 8px; line-height: normal;'; nextDayButton.onclick = handleNextDayClick;
        panel.appendChild(nextDayButton);
        const separator = parentArea.querySelector('.controls__separator-IWka22iN');
        if (separator) { separator.parentNode.insertBefore(panel, separator.nextSibling); }
        else { parentArea.appendChild(panel); }
        console.log('کنترل‌های سفارشی Replay اضافه شدند.');
    }

    // --- MutationObserver ---
    console.log('Userscript (v2.7.0 - Final User Version) شروع به کار کرد...');
    const observer = new MutationObserver(function(mutations, obs) {
        const controlsExist = document.querySelector(REPLAY_CONTROLS_AREA_SELECTOR);
        const customControlsExist = document.querySelector('.custom-replay-controls');
        if (controlsExist && !customControlsExist) { createCustomControls(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(createCustomControls, 1000);

})();
