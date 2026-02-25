import type { TEventRecord } from "src/types";

export const HIJRI_EVENTS: TEventRecord = {
	1: {
		9: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "تاسوعای حسینی", en: "Tasu'a of Husayn" },
			},
		],
		10: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "عاشورای حسینی", en: "Ashura of Husayn" },
			},
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "روزه عاشورا", en: "Fast of Ashura" },
			},
		],
		11: [
			{
				isHoliday: false,
				categories: ["official"],
				title: {
					fa: "روز تجلیل از اسرا و مفقودان",
					en: "Day of Honoring Prisoners and Missing Persons",
				},
			},
		],
		12: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شهادت امام سجاد(ع)", en: "Martyrdom of Imam al-Sajjad" },
			},
		],
		25: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "شهادت امام سجاد(ع) به روایتی",
					en: "Martyrdom of Imam al-Sajjad(according to a narration)",
				},
			},
		],
	},
	2: {
		3: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "ولادت امام محمد باقر(ع) به روایتی",
					en: "Birth of Imam Muhammad al-Baqir(according to a narration)",
				},
			},
		],
		7: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "شهادت امام حسن(ع) به روایتی",
					en: "Martyrdom of Imam Hasan(according to a narration)",
				},
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز بزرگداشت سلمان فارسی", en: "Commemoration of Salman al-Farsi" },
			},
		],
		20: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "اربعین حسینی", en: "Arba'een of Husayn" },
			},
		],
		27: [
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز وقف", en: "Endowment Day" },
			},
		],
		28: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: {
					fa: "رحلت پیامبر(ص)",
					en: "Passing of Prophet Muhammad",
				},
			},
			{
				isHoliday: false,
				categories: ["sunni"],
				title: {
					fa: "رحلت پیامبر(ص)",
					en: "Passing of Prophet Muhammad",
				},
			},
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: {
					fa: "شهادت امام حسن(ع)",
					en: "Martyrdom of Imam Hasan",
				},
			},
		],
		30: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "شهادت امام رضا(ع)", en: "Martyrdom of Imam Reza" },
			},
		],
	},
	3: {
		1: [
			{
				isHoliday: false,
				categories: ["shia", "sunni"],
				title: {
					fa: "هجرت پیامبر(ص) از مکه به مدینه",
					en: "Hijra of Prophet Muhammad from Mecca to Medina",
				},
			},
		],
		8: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: {
					fa: "شهادت امام حسن عسکری(ع) و آغاز امامت حضرت مهدی(عج)",
					en: "Martyrdom of Imam Hasan al-Askari & Start of Imamate of Imam Mahdi",
				},
			},
		],
		12: [
			{
				isHoliday: false,
				categories: ["shia", "sunni"],
				title: { fa: "ورود پیامبر به مدینه", en: "Prophet's Arrival in Medina" },
			},
			{
				isHoliday: false,
				categories: ["sunni"],
				title: {
					fa: "ولادت پیامبر(ص)",
					en: "Birth of Prophet Muhammad",
				},
			},
			{
				isHoliday: false,
				categories: ["shia", "sunni", "official"],
				title: { fa: "آغاز هفتهٔ وحدت", en: "Start of Unity Week" },
			},
		],
		15: [
			{
				isHoliday: false,
				categories: ["shia", "sunni"],
				title: { fa: "بنای مسجد قبا", en: "Construction of Quba Mosque" },
			},
		],
		16: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "ورود اهل بیت امام حسین(ع) به شام",
					en: "Entry of Ahl al-Bayt of Imam Husayn into Syria",
				},
			},
		],
		17: [
			{
				isHoliday: false,
				categories: ["shia", "sunni"],
				title: { fa: "بنای مسجدالنبی در مدینه", en: "Construction of Prophet's Mosque in Medina" },
			},
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: {
					fa: "ولادت پیامبر(ص)",
					en: "Birth of Prophet Muhammad",
				},
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: {
					fa: "روز اخلاق و مهرورزی",
					en: "Day of Ethics and Kindness",
				},
			},
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "ولادت امام صادق(ع)", en: "Birth of Imam al-Sadiq" },
			},
		],
		23: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ورود حضرت معصومه(س) به قم", en: "Arrival of Hazrat Masoumeh to Qom" },
			},
		],
		26: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "صلح امام حسن(ع)", en: "Peace Treaty of Imam Hasan" },
			},
		],
	},
	4: {
		3: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "سفر امام حسن(ع) به جرجان", en: "Journey of Imam Hasan to Jurjan" },
			},
		],
		4: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت شاه عبدالعظیم حسنی(ع)", en: "Birth of Shah Abdul-Azim al-Hasani" },
			},
		],
		8: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام حسن عسکری(ع)", en: "Birth of Imam Hasan al-Askari" },
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "شهادت حضرت فاطمهٔ زهرا(س) به روایتی",
					en: "Martyrdom of Hazrat Fatimah(according to a narration)",
				},
			},
		],
		10: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "وفات حضرت معصومه(س)", en: "Passing of Hazrat Masoumeh" },
			},
		],
	},
	5: {
		5: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت حضرت زینب(س)", en: "Birth of Hazrat Zainab" },
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز پرستار", en: "Nurse Day" },
			},
		],
		10: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "جنگ جمل", en: "Battle of Jamal" },
			},
		],
		13: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "شهادت حضرت فاطمهٔ زهرا(س) به روایتی",
					en: "Martyrdom of Hazrat Fatimah(according to a narration)",
				},
			},
		],
	},
	6: {
		3: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "شهادت حضرت فاطمهٔ(س)", en: "Martyrdom of Hazrat Fatimah" },
			},
		],
		12: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "حرکت پیامبر به سمت خیبر", en: "Prophet's Movement Towards Khyber" },
			},
		],
		13: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "سالروز وفات حضرت ام‌البنین(س)",
					en: "Anniversary of Passing of Hazrat Umm al-Banin",
				},
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: {
					fa: "روز تکریم مادران و همسران شهدا",
					en: "Day to Honor Mothers and Wives of Martyrs",
				},
			},
		],
		20: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت حضرت فاطمهٔ زهرا(س)", en: "Birth of Hazrat Fatimah" },
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "روز زن و مادر", en: "Women's and Mother's Day" },
			},
		],
		21: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت حضرت ام‌کلثوم(س)", en: "Birth of Hazrat Umm Kulthum" },
			},
		],
	},
	7: {
		1: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام باقر(ع)", en: "Birth of Imam al-Baqir" },
			},
		],
		3: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شهادت امام هادی(ع)", en: "Martyrdom of Imam al-Hadi" },
			},
		],
		9: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت حضرت علی اصغر(ع)", en: "Birth of Hazrat Ali Asghar" },
			},
		],
		10: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام جواد(ع))", en: "Birth of Imam Javad" },
			},
		],
		13: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "ولادت امام علی(ع)", en: "Birth of Imam Ali" },
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز پدر و مرد", en: "Father's and Men's Day" },
			},
		],
		15: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "وفات حضرت زینب(س)", en: "Passing of Hazrat Zainab" },
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "تغییر قبلهٔ مسلمین از بیت‌المقدس به مکهٔ",
					en: "Change of Qibla from Jerusalem to Mecca",
				},
			},
		],
		16: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "خروج فاطمه بنت اسد از کعبه", en: "Exit of Fatimah bint Asad from Kaaba" },
			},
		],
		23: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "مجروح شدن امام حسن(ع) در ساباط مدائن",
					en: "Injury of Imam Hasan in Sabat Mada'in",
				},
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "مسموم شدن امام کاظم(ع)", en: "Poisoning of Imam al-Kadhim" },
			},
		],
		24: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "فتح خیبر توسط امام علی(ع)", en: "Conquest of Khyber by Imam Ali" },
			},
		],
		25: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شهادت امام کاظم(ع)", en: "Martyrdom of Imam al-Kadhim" },
			},
		],
		27: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: {
					fa: "مبعث پیامبر(ص)، شب معراج",
					en: "Mab'ath of Prophet Muhammad, Isra and Mi'raj",
				},
			},
			{
				isHoliday: false,
				categories: ["sunni"],
				title: {
					fa: "مبعث پیامبر(ص)، شب معراج",
					en: "Mab'ath of Prophet Muhammad, Isra and Mi'raj",
				},
			},
		],
	},
	8: {
		3: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام حسین(ع)", en: "Birth of Imam Husayn" },
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز پاسداری از اسلام", en: "Protection of Islam Day" },
			},
		],
		4: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت حضرت ابوالفضل(ع)", en: "Birth of Hazrat Abolfazl" },
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز جانباز", en: "Veteran's Day" },
			},
		],
		5: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام سجاد(ع)", en: "Birth of Imam al-Sajjad" },
			},
		],
		11: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت حضرت علی اکبر(ع)", en: "Birth of Hazrat Ali Akbar" },
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز جوان", en: "Youth Day" },
			},
		],
		15: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "ولادت حضرت مهدی(عج)", en: "Birth of Imam Mahdi" },
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "روز جهانی مستضعفان", en: "International Day of the Oppressed" },
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "روز سربازان گمنام امام زمان(عج)",
					en: "Day of the Hidden Soldiers of Imam Zaman",
				},
			},
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "شب برائت(نیمه شعبان)", en: "Laylat al-Bara'at(Mid-Sha'ban)" },
			},
		],
	},
	9: {
		10: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "وفات حضرت خدیجه(س)", en: "Passing of Hazrat Khadijah" },
			},
		],
		15: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام حسن مجتبی(ع)", en: "Birth of Imam Hasan al-Mujtaba" },
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "روز اکرام", en: "Day of Honor" },
			},
		],
		18: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شب قدر", en: "Night of Qadr" },
			},
		],
		19: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ضربت خوردن امام علی(ع)", en: "Assassination Attempt on Imam Ali" },
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز ملی نهج البلاغه", en: "National Nahj al-Balagha Day" },
			},
		],
		20: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شب قدر", en: "Night of Qadr" },
			},
		],
		21: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "شهادت امام علی(ع)", en: "Martyrdom of Imam Ali" },
			},
		],
		22: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شب قدر", en: "Night of Qadr" },
			},
		],
		27: [
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "شب قدر", en: "Night of Qadr" },
			},
		],
	},
	10: {
		1: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "عید سعید فطر", en: "Eid al-Fitr" },
			},
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "عید سعید فطر", en: "Eid al-Fitr" },
			},
		],
		17: [
			{
				isHoliday: false,
				categories: ["official"],
				title: {
					fa: "روز فرهنگ پهلوانی و ورزش زورخانه‌ای",
					en: "Day of Pahlavani Culture & Zurkhaneh Sports",
				},
			},
		],
		25: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "شهادت امام صادق(ع)", en: "Martyrdom of Imam al-Sadiq" },
			},
		],
	},
	11: {
		1: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت حضرت معصومه(س)", en: "Birth of Hazrat Masoumeh" },
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز دختر", en: "Daughter's Day" },
			},
		],
		5: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "روز تجلیل از امام‌زادگان و بقاع متبرکه",
					en: "Day of Honoring Imamzadehs and Sacred Shrines",
				},
			},
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "روز بزرگداشت امام کاظم(ع)", en: "Commemoration of Imam al-Kadhim" },
			},
		],
		6: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "روز بزرگداشت حضرت شاهچراغ(ع)", en: "Commemoration of Hazrat Shah Cheragh" },
			},
		],
		11: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام رضا(ع)", en: "Birth of Imam Reza" },
			},
		],
		30: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شهادت امام جواد(ع)", en: "Martyrdom of Imam Javad" },
			},
		],
	},
	12: {
		1: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: {
					fa: "سالروز ازدواج امام علی(ع) و حضرت فاطمه(س)",
					en: "Anniversary of Marriage of Imam Ali & Hazrat Fatimah",
				},
			},
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز ازدواج", en: "Marriage Day" },
			},
		],
		7: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "شهادت امام باقر(ع)", en: "Martyrdom of Imam al-Baqir" },
			},
		],
		9: [
			{
				isHoliday: false,
				categories: ["shia", "sunni"],
				title: { fa: "روز عرفه", en: "Day of Arafah" },
			},
		],
		10: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "عید سعید قربان", en: "Eid al-Adha" },
			},
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "عید سعید قربان", en: "Eid al-Adha" },
			},
		],
		11: [
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "روزهای تشریق", en: "Days of Tashriq" },
			},
		],
		12: [
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "روزهای تشریق", en: "Days of Tashriq" },
			},
		],
		13: [
			{
				isHoliday: false,
				categories: ["sunni"],
				title: { fa: "روزهای تشریق", en: "Days of Tashriq" },
			},
		],
		15: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام هادی(ع)", en: "Birth of Imam al-Hadi" },
			},
		],
		18: [
			{
				isHoliday: true,
				categories: ["shia", "official"],
				title: { fa: "عید سعید غدیر خم", en: "Eid al-Ghadir" },
			},
		],
		20: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "ولادت امام کاظم(ع)", en: "Birth of Imam al-Kadhim" },
			},
		],
		24: [
			{
				isHoliday: false,
				categories: ["shia"],
				title: { fa: "روز مباهلهٔ پیامبر(ص)", en: "Day of Mubahala of Prophet Muhammad" },
			},
		],
		25: [
			{
				isHoliday: false,
				categories: ["official"],
				title: { fa: "روز خانواده و تکریم بازنشستگان", en: "Family Day & Honoring Retirees" },
			},
		],
	},
} as const;
