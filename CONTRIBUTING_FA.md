<div dir="ltr" align="center">

[**English**](CONTRIBUTING.md) / [**فارسی**](CONTRIBUTING_FA.md)

</div>

<div dir="rtl">

# راهنمای مشارکت در توسعه

به جمع کسانی که این پروژه را زنده نگه داشته‌اند خوش آمدید💚

همین حالا که این متن را می‌نویسم این پروژه **بیش از ۸هزار دانلود** دارد؛ یعنی هر باگ فیکس، هر
پیشنهاد، هر بهبود کوچک می‌تواند تجربه‌ی هزاران نفر را بهبود دهد.

مشارکت فقط نوشتن کد نیست. گزارش باگ، پیشنهاد قابلیت جدید، بهبود مستندات، پاسخ دادن به سوال کاربران،
معرفی پلاگین به دوستان و حتی بازخورد ساده‌ی شما هم بخشی از رشد این پروژه است.

اگر دوست دارید در توسعه‌ی این پلاگین همراه ما باشید، لطفاً نکات زیر را بخوانید.

## نحوه‌ی مشارکت

1. مخزن را **fork** کنید.
2. یک **branch** با نام واضح (مثلاً `fix/calendar-header` یا `feature/shortcut`) ایجاد کنید.
3. تغییرات خود را اعمال کنید و commit‌های کوچک و معنادار بنویسید.
4. ورژن را از طریق `git tag` و فایل `manifest.json` مشخص کنید و دستور `pnpm run version` را بزنید.
5. در نهایت Pull Request را باز کنید و در توضیحات آن دقیقاً بنویسید چه مسئله‌ای را حل می‌کند.

> در پیاده‌سازی معماری این پروژه از معماری پلاگین‌های موفقی همچون
> [notebook-navigator](https://github.com/johansan/notebook-navigator) و
> [Templater](https://github.com/SilentVoid13/Templater) و
> [Journals](https://github.com/srg-kostyrko/obsidian-journal) استفاده کردیم. اگر مایلید این
> ساختار را بهبود ببخشید، پیش از هر کاری با ما مشورت کنید.

> تمام قالب‌های مربوط به فرمت کد توسط **editorconfig** و **prettierrc** و **eslintrc** و… مشخص
> شده‌اند. از شما درخواست می‌کنیم **این چهارچوب را تغییر ندهید** و کد خود را با همان استانداردها
> ارائه دهید.

> تنها وابستگی خارجی این پلاگین در سمت کاربر، کتابخانه‌ی
> [`@internationalized/date`](https://www.npmjs.com/package/@internationalized/date) از مجموعه‌ی
> React-Aria شرکت Adobe است. لطفاً از افزودن کتابخانه‌ی جدید بدون مشورت با ما پرهیز کنید.

## برای تازه‌واردان به توسعه‌ی پلاگین ابسیدین

اگر تجربه‌ی توسعه‌ی پلاگین برای ابسیدین را ندارید و مشتاق هستید در این مسیر با ما همراه شوید، مسیر
زیر را به شما پیشنهاد می‌کنیم:

**یادگیری Typescript**: [این ویدیو را پیشنهاد می‌کنم](https://www.youtube.com/watch?v=BCg4U1FzODs)

**آشنایی با ساختار پلاگین‌های ابسیدین**:
[این ویدیو را پیشنهاد می‌کنم](https://www.youtube.com/watch?v=AgXa03ZxJ88)

**درک فانکشن‌های پایه‌ی این پلاگین**: می‌توانید با مراجعه به [این یادداشت](src/utils/README.md) با
این توابع آشنا شوید و در توسعه از آن‌ها بهره ببرید.

**برای چالش‌ها**: می‌توانید به [مستندات رسمی ابسیدین برای توسعه‌ی پلاگین](https://docs.obsidian.md)
مراجعه کنید یا از مدل‌های زبانی [Claude](https://claude.ai) و [ChatGPT](https://chatgpt.com) و
[Gemini](https://gemini.google.com) و [DeepSeek](https://chat.deepseek.com) کمک بگیرید.

## راه‌های ارتباطی

شما می‌توانید از طریق Issue همین صفحه‌ی گیتهاب یا راه‌های زیر با ما در ارتباط باشید:

<div align=center>

[![Telegram](https://img.shields.io/badge/Telegram-@HMalek-26A5E4?logo=telegram&logoColor=white)](https://t.me/HMalek)
[![Telegram](https://img.shields.io/badge/Telegram-@NedaManiOfficial-26A5E4?logo=telegram&logoColor=white)](https://t.me/NedaManiOfficial)

</div>

</div>
