// Samvidhan Divas (Constitution Day) page, /samvidhan: the Preamble, Dr. Ambedkar's speech of 25 November 1949, and the quiz.
// All the words are here, so they can be corrected without touching the page.

// The Home page shows the Samvidhan Divas banner on these days every year (Indian time).
// 25 November: Dr. Ambedkar's last speech in the Constituent Assembly. 26 November: the Constitution was adopted.
export const SAMVIDHAN_DAYS = ['11-25', '11-26']

// True on those days in India; ?samvidhan=1 in the address shows the banner on any day (to check how it looks)
export function isSamvidhanTime(now = new Date()) {
    try { if (new URLSearchParams(window.location.search).get('samvidhan') === '1') return true } catch { /* no window */ }
    const md = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', month: '2-digit', day: '2-digit' }).format(now)
    return SAMVIDHAN_DAYS.includes(md)
}

// The footer shows the Samvidhan Divas link only in its season: 1 November to 26 January
// (the build-up to Samvidhan Divas, through to Republic Day). The page itself stays open all year,
// so shared certificates and quiz links keep working. ?samvidhan=1 shows the link on any day.
export const SEASON = { from: '11-01', to: '01-26' }
export function isSamvidhanSeason(now = new Date()) {
    try { if (new URLSearchParams(window.location.search).get('samvidhan') === '1') return true } catch { /* no window */ }
    const md = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', month: '2-digit', day: '2-digit' }).format(now)
    // The season crosses the new year, so it is "from 1 Nov onwards" OR "up to 26 Jan"
    return md >= SEASON.from || md <= SEASON.to
}

// The Preamble, one line per phrase. English: the official text. Hindi: the official Hindi text (भारत का संविधान).
export const PREAMBLE = {
    en: [
        'WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens:',
        'JUSTICE, social, economic and political;',
        'LIBERTY of thought, expression, belief, faith and worship;',
        'EQUALITY of status and of opportunity;',
        'and to promote among them all',
        'FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation;',
        'IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.',
    ],
    hi: [
        'हम, भारत के लोग, भारत को एक संपूर्ण प्रभुत्व-संपन्न समाजवादी पंथनिरपेक्ष लोकतंत्रात्मक गणराज्य बनाने के लिए, तथा उसके समस्त नागरिकों को:',
        'सामाजिक, आर्थिक और राजनैतिक न्याय,',
        'विचार, अभिव्यक्ति, विश्वास, धर्म और उपासना की स्वतंत्रता,',
        'प्रतिष्ठा और अवसर की समता',
        'प्राप्त कराने के लिए, तथा उन सब में',
        'व्यक्ति की गरिमा और राष्ट्र की एकता और अखंडता सुनिश्चित करने वाली बंधुता बढ़ाने के लिए',
        'दृढ़संकल्प होकर अपनी इस संविधान सभा में आज तारीख 26 नवंबर, 1949 ई. (मिति मार्गशीर्ष शुक्ला सप्तमी, संवत् दो हजार छह विक्रमी) को एतद्द्वारा इस संविधान को अंगीकृत, अधिनियमित और आत्मार्पित करते हैं।',
    ],
}

// Passages from Dr. Ambedkar's speech in the Constituent Assembly on 25 November 1949.
// English: his words. Hindi: a translation (भावानुवाद). context = a short note on what he was speaking about.
export const SPEECH = [
    {
        titleEn: 'A life of contradictions',
        titleHi: 'विरोधाभासों का जीवन',
        bodyEn: 'On the 26th of January 1950, we are going to enter into a life of contradictions. In politics we will have equality and in social and economic life we will have inequality. In politics we will be recognizing the principle of one man one vote and one vote one value. In our social and economic life, we shall, by reason of our social and economic structure, continue to deny the principle of one man one value. How long shall we continue to live this life of contradictions?',
        bodyHi: '26 जनवरी 1950 को हम विरोधाभासों से भरे जीवन में प्रवेश करने जा रहे हैं। राजनीति में हमारे पास समानता होगी, पर सामाजिक और आर्थिक जीवन में असमानता। राजनीति में हम "एक व्यक्ति, एक वोट" और "एक वोट, एक मूल्य" के सिद्धांत को मानेंगे। पर अपने सामाजिक और आर्थिक जीवन में, अपनी सामाजिक और आर्थिक संरचना के कारण, हम "एक व्यक्ति, एक मूल्य" के सिद्धांत को नकारते रहेंगे। हम कब तक विरोधाभासों का यह जीवन जीते रहेंगे?',
    },
    {
        titleEn: 'Social democracy',
        titleHi: 'सामाजिक लोकतंत्र',
        bodyEn: 'We must make our political democracy a social democracy as well. Political democracy cannot last unless there lies at the base of it social democracy. What does social democracy mean? It means a way of life which recognizes liberty, equality and fraternity as the principles of life.',
        bodyHi: 'हमें अपने राजनीतिक लोकतंत्र को सामाजिक लोकतंत्र भी बनाना होगा। राजनीतिक लोकतंत्र तब तक टिक नहीं सकता, जब तक उसकी नींव में सामाजिक लोकतंत्र न हो। सामाजिक लोकतंत्र का क्या अर्थ है? इसका अर्थ है जीवन का ऐसा तरीका, जो स्वतंत्रता, समानता और बंधुत्व को जीवन के सिद्धांत मानता है।',
    },
    {
        titleEn: 'Fraternity',
        titleHi: 'बंधुत्व',
        bodyEn: 'Fraternity means a sense of common brotherhood of all Indians.',
        bodyHi: 'बंधुत्व का अर्थ है सभी भारतीयों के बीच एक साझा भाईचारे की भावना।',
    },
    {
        titleEn: 'Beware of hero-worship',
        titleHi: 'व्यक्ति-पूजा से सावधान',
        bodyEn: '…in politics, Bhakti or hero-worship is a sure road to degradation and to eventual dictatorship.',
        bodyHi: '…राजनीति में भक्ति या व्यक्ति-पूजा पतन और अंततः तानाशाही का निश्चित रास्ता है।',
    },
    {
        titleEn: 'The grammar of anarchy',
        titleHi: 'अराजकता का व्याकरण',
        contextEn: 'On civil disobedience, non-cooperation and satyagraha, once constitutional ways are open:',
        contextHi: 'संवैधानिक रास्ते खुले होने पर सविनय अवज्ञा, असहयोग और सत्याग्रह जैसे तरीकों के बारे में:',
        bodyEn: 'These methods are nothing but the Grammar of Anarchy and the sooner they are abandoned, the better for us.',
        bodyHi: 'ये तरीके अराजकता के व्याकरण के सिवा कुछ नहीं हैं, और जितनी जल्दी इन्हें छोड़ दिया जाए, हमारे लिए उतना ही अच्छा है।',
    },
    {
        titleEn: 'It depends on the people',
        titleHi: 'सब कुछ लोगों पर निर्भर है',
        bodyEn: 'However good a Constitution may be, it is sure to turn out bad because those who are called to work it, happen to be a bad lot. However bad a Constitution may be, it may turn out to be good if those who are called to work it, happen to be a good lot.',
        bodyHi: 'संविधान चाहे कितना भी अच्छा क्यों न हो, अगर उसे चलाने वाले लोग बुरे निकले, तो वह बुरा ही साबित होगा। और संविधान चाहे कितना भी बुरा क्यों न हो, अगर उसे चलाने वाले लोग अच्छे हों, तो वह अच्छा साबित हो सकता है।',
    },
]

// The quiz bank. Each game picks QUIZ_MIX questions from it (easy first, hard last) and shuffles the answers,
// so the quiz feels new every time and every year. To add a question, copy one block and give it a level.
// answer = the number of the right option in the list below (0 = the first); the game shuffles them itself.
export const QUIZ = [
    {
        level: 'easy',
        qEn: 'On which date did the Constituent Assembly adopt the Constitution of India?',
        qHi: 'संविधान सभा ने भारत का संविधान किस तारीख को अपनाया?',
        options: [['15 August 1947', '15 अगस्त 1947'], ['26 November 1949', '26 नवंबर 1949'], ['26 January 1950', '26 जनवरी 1950'], ['9 December 1946', '9 दिसंबर 1946']],
        answer: 1,
        whyEn: 'It was adopted on 26 November 1949, which is why this day is Samvidhan Divas.',
        whyHi: 'यह 26 नवंबर 1949 को अपनाया गया था, इसलिए यह दिन संविधान दिवस है।',
    },
    {
        level: 'easy',
        qEn: 'When did the Constitution come into force?',
        qHi: 'संविधान कब लागू हुआ?',
        options: [['26 January 1950', '26 जनवरी 1950'], ['15 August 1950', '15 अगस्त 1950'], ['26 November 1950', '26 नवंबर 1950'], ['2 October 1949', '2 अक्टूबर 1949']],
        answer: 0,
        whyEn: 'It came into force on 26 January 1950, celebrated as Republic Day.',
        whyHi: 'यह 26 जनवरी 1950 को लागू हुआ, जिसे गणतंत्र दिवस के रूप में मनाया जाता है।',
    },
    {
        level: 'easy',
        qEn: 'Who was the Chairman of the Drafting Committee of the Constitution?',
        qHi: 'संविधान की प्रारूप समिति के अध्यक्ष कौन थे?',
        options: [['Dr. Rajendra Prasad', 'डॉ. राजेंद्र प्रसाद'], ['Jawaharlal Nehru', 'जवाहरलाल नेहरू'], ['Dr. B. R. Ambedkar', 'डॉ. बी. आर. आंबेडकर'], ['Sardar Vallabhbhai Patel', 'सरदार वल्लभभाई पटेल']],
        answer: 2,
        whyEn: 'Dr. B. R. Ambedkar chaired the Drafting Committee and is called the chief architect of the Constitution.',
        whyHi: 'डॉ. बी. आर. आंबेडकर प्रारूप समिति के अध्यक्ष थे और उन्हें संविधान का मुख्य शिल्पकार कहा जाता है।',
    },
    {
        level: 'medium',
        qEn: 'Who was the President of the Constituent Assembly?',
        qHi: 'संविधान सभा के अध्यक्ष कौन थे?',
        options: [['Dr. Rajendra Prasad', 'डॉ. राजेंद्र प्रसाद'], ['Dr. B. R. Ambedkar', 'डॉ. बी. आर. आंबेडकर'], ['Maulana Abul Kalam Azad', 'मौलाना अबुल कलाम आज़ाद'], ['C. Rajagopalachari', 'सी. राजगोपालाचारी']],
        answer: 0,
        whyEn: 'Dr. Rajendra Prasad presided over the Constituent Assembly and later became India\'s first President.',
        whyHi: 'डॉ. राजेंद्र प्रसाद संविधान सभा के अध्यक्ष थे और बाद में भारत के पहले राष्ट्रपति बने।',
    },
    {
        level: 'medium',
        qEn: 'Which Article of the Constitution abolishes untouchability?',
        qHi: 'संविधान का कौन-सा अनुच्छेद अस्पृश्यता (छुआछूत) को समाप्त करता है?',
        options: [['Article 14', 'अनुच्छेद 14'], ['Article 17', 'अनुच्छेद 17'], ['Article 21', 'अनुच्छेद 21'], ['Article 32', 'अनुच्छेद 32']],
        answer: 1,
        whyEn: 'Article 17 abolishes untouchability and forbids its practice in any form.',
        whyHi: 'अनुच्छेद 17 अस्पृश्यता को समाप्त करता है और किसी भी रूप में इसके आचरण को वर्जित करता है।',
    },
    {
        level: 'hard',
        qEn: 'Which Article did Dr. Ambedkar call "the very soul of the Constitution and the very heart of it"?',
        qHi: 'डॉ. आंबेडकर ने किस अनुच्छेद को "संविधान की आत्मा और हृदय" कहा?',
        options: [['Article 19', 'अनुच्छेद 19'], ['Article 21', 'अनुच्छेद 21'], ['Article 32', 'अनुच्छेद 32'], ['Article 370', 'अनुच्छेद 370']],
        answer: 2,
        whyEn: 'Article 32 lets every person go straight to the Supreme Court to protect their Fundamental Rights.',
        whyHi: 'अनुच्छेद 32 हर व्यक्ति को अपने मौलिक अधिकारों की रक्षा के लिए सीधे सर्वोच्च न्यायालय जाने का अधिकार देता है।',
    },
    {
        level: 'hard',
        qEn: 'Which words were added to the Preamble by the 42nd Amendment in 1976?',
        qHi: '1976 में 42वें संशोधन द्वारा उद्देशिका में कौन-से शब्द जोड़े गए?',
        options: [['Sovereign and Democratic', 'संप्रभु और लोकतांत्रिक'], ['Justice and Liberty', 'न्याय और स्वतंत्रता'], ['Socialist and Secular', 'समाजवादी और पंथनिरपेक्ष'], ['Republic and Fraternity', 'गणराज्य और बंधुता']],
        answer: 2,
        whyEn: '"Socialist", "Secular" and "integrity" were added to the Preamble by the 42nd Amendment.',
        whyHi: '42वें संशोधन से उद्देशिका में "समाजवादी", "पंथनिरपेक्ष" और "अखंडता" शब्द जोड़े गए।',
    },
    {
        level: 'medium',
        qEn: 'About how long did it take to make the Constitution?',
        qHi: 'संविधान बनाने में लगभग कितना समय लगा?',
        options: [['1 year', '1 वर्ष'], ['2 years, 11 months and 18 days', '2 वर्ष, 11 महीने और 18 दिन'], ['5 years', '5 वर्ष'], ['6 months', '6 महीने']],
        answer: 1,
        whyEn: 'The Constituent Assembly took 2 years, 11 months and 18 days.',
        whyHi: 'संविधान सभा को 2 वर्ष, 11 महीने और 18 दिन लगे।',
    },
    {
        level: 'medium',
        qEn: 'Where was Dr. B. R. Ambedkar born?',
        qHi: 'डॉ. बी. आर. आंबेडकर का जन्म कहाँ हुआ था?',
        options: [['Nagpur, Maharashtra', 'नागपुर, महाराष्ट्र'], ['Mhow, Madhya Pradesh', 'महू, मध्य प्रदेश'], ['Mumbai, Maharashtra', 'मुंबई, महाराष्ट्र'], ['Delhi', 'दिल्ली']],
        answer: 1,
        whyEn: 'He was born on 14 April 1891 in Mhow, now called Dr. Ambedkar Nagar, in Madhya Pradesh.',
        whyHi: 'उनका जन्म 14 अप्रैल 1891 को महू में हुआ था, जिसे अब डॉ. आंबेडकर नगर कहा जाता है (मध्य प्रदेश)।',
    },
    {
        level: 'hard',
        qEn: 'Since which year has 26 November been officially celebrated as Constitution Day?',
        qHi: '26 नवंबर को आधिकारिक रूप से संविधान दिवस कब से मनाया जाता है?',
        options: [['1950', '1950'], ['1976', '1976'], ['2015', '2015'], ['2020', '2020']],
        answer: 2,
        whyEn: 'Since 2015, the 125th birth anniversary year of Dr. Ambedkar.',
        whyHi: '2015 से, जो डॉ. आंबेडकर की 125वीं जयंती का वर्ष था।',
    },
    // ---------- Easy ----------
    {
        level: 'easy',
        qEn: 'With which words does the Preamble of the Constitution begin?',
        qHi: 'संविधान की उद्देशिका किन शब्दों से शुरू होती है?',
        options: [['We, the people of India', 'हम, भारत के लोग'], ['In the name of God', 'ईश्वर के नाम पर'], ['India, that is Bharat', 'भारत, अर्थात इंडिया'], ['We, the members of Parliament', 'हम, संसद के सदस्य']],
        answer: 0,
        whyEn: 'It begins "We, the people of India": the Constitution comes from the people themselves.',
        whyHi: 'यह "हम, भारत के लोग" से शुरू होती है: संविधान की शक्ति स्वयं जनता से आती है।',
    },
    {
        level: 'easy',
        qEn: 'On which day is Dr. Ambedkar\'s birthday (Ambedkar Jayanti) celebrated?',
        qHi: 'डॉ. आंबेडकर का जन्मदिन (आंबेडकर जयंती) किस दिन मनाया जाता है?',
        options: [['14 April', '14 अप्रैल'], ['6 December', '6 दिसंबर'], ['26 January', '26 जनवरी'], ['2 October', '2 अक्टूबर']],
        answer: 0,
        whyEn: 'He was born on 14 April 1891, and the day is celebrated across India as Ambedkar Jayanti.',
        whyHi: 'उनका जन्म 14 अप्रैल 1891 को हुआ था, और यह दिन पूरे भारत में आंबेडकर जयंती के रूप में मनाया जाता है।',
    },
    {
        level: 'easy',
        qEn: 'By what name do people lovingly call Dr. B. R. Ambedkar?',
        qHi: 'लोग डॉ. बी. आर. आंबेडकर को प्यार से किस नाम से बुलाते हैं?',
        options: [['Bapu', 'बापू'], ['Babasaheb', 'बाबासाहेब'], ['Netaji', 'नेताजी'], ['Lokmanya', 'लोकमान्य']],
        answer: 1,
        whyEn: '"Babasaheb" means respected father. Bapu is Mahatma Gandhi, Netaji is Subhas Chandra Bose and Lokmanya is Bal Gangadhar Tilak.',
        whyHi: '"बाबासाहेब" का अर्थ है आदरणीय पिता। बापू महात्मा गांधी हैं, नेताजी सुभाष चंद्र बोस और लोकमान्य बाल गंगाधर तिलक।',
    },
    {
        level: 'easy',
        qEn: 'Which of these is NOT one of the four ideals in the Preamble?',
        qHi: 'इनमें से कौन-सा उद्देशिका के चार आदर्शों में से नहीं है?',
        options: [['Justice', 'न्याय'], ['Liberty', 'स्वतंत्रता'], ['Wealth', 'धन-संपत्ति'], ['Fraternity', 'बंधुता']],
        answer: 2,
        whyEn: 'The four ideals are Justice, Liberty, Equality and Fraternity. Wealth is not one of them.',
        whyHi: 'चार आदर्श हैं: न्याय, स्वतंत्रता, समता और बंधुता। धन-संपत्ति इनमें नहीं है।',
    },
    {
        level: 'easy',
        qEn: 'The Constitution of India is the longest written constitution of…',
        qHi: 'भारत का संविधान किसका सबसे लंबा लिखित संविधान है?',
        options: [['Asia only', 'केवल एशिया का'], ['Any country in the world', 'दुनिया के किसी भी देश का'], ['The British Commonwealth only', 'केवल राष्ट्रमंडल देशों का'], ['South Asia only', 'केवल दक्षिण एशिया का']],
        answer: 1,
        whyEn: 'It is the longest written constitution of any country in the world.',
        whyHi: 'यह दुनिया के किसी भी देश का सबसे लंबा लिखित संविधान है।',
    },
    {
        level: 'easy',
        qEn: 'Who was the first Law Minister of independent India?',
        qHi: 'स्वतंत्र भारत के पहले कानून मंत्री कौन थे?',
        options: [['Dr. B. R. Ambedkar', 'डॉ. बी. आर. आंबेडकर'], ['Sardar Vallabhbhai Patel', 'सरदार वल्लभभाई पटेल'], ['Dr. Rajendra Prasad', 'डॉ. राजेंद्र प्रसाद'], ['Maulana Abul Kalam Azad', 'मौलाना अबुल कलाम आज़ाद']],
        answer: 0,
        whyEn: 'Dr. Ambedkar was the first Minister of Law and Justice in Jawaharlal Nehru\'s cabinet.',
        whyHi: 'डॉ. आंबेडकर जवाहरलाल नेहरू के मंत्रिमंडल में पहले कानून एवं न्याय मंत्री थे।',
    },
    {
        level: 'easy',
        qEn: 'What is the minimum age to vote in India?',
        qHi: 'भारत में वोट देने की न्यूनतम उम्र क्या है?',
        options: [['16 years', '16 वर्ष'], ['18 years', '18 वर्ष'], ['21 years', '21 वर्ष'], ['25 years', '25 वर्ष']],
        answer: 1,
        whyEn: 'Every citizen aged 18 or more can vote. It was 21 until 1989.',
        whyHi: '18 वर्ष या उससे अधिक उम्र का हर नागरिक वोट दे सकता है। 1989 तक यह उम्र 21 वर्ष थी।',
    },
    {
        level: 'easy',
        qEn: 'Which word in the Preamble means India has no king and the head of state is chosen?',
        qHi: 'उद्देशिका का कौन-सा शब्द बताता है कि भारत में कोई राजा नहीं है और राष्ट्र प्रमुख चुना जाता है?',
        options: [['Sovereign', 'संप्रभु'], ['Secular', 'पंथनिरपेक्ष'], ['Republic', 'गणराज्य'], ['Socialist', 'समाजवादी']],
        answer: 2,
        whyEn: 'A Republic has an elected head of state (the President), not a king or queen.',
        whyHi: 'गणराज्य में राष्ट्र प्रमुख (राष्ट्रपति) चुना जाता है, कोई राजा या रानी नहीं होते।',
    },
    {
        level: 'easy',
        qEn: 'On which day is Dr. Ambedkar\'s death anniversary observed as Mahaparinirvan Diwas?',
        qHi: 'डॉ. आंबेडकर की पुण्यतिथि महापरिनिर्वाण दिवस के रूप में किस दिन मनाई जाती है?',
        options: [['14 April', '14 अप्रैल'], ['26 November', '26 नवंबर'], ['6 December', '6 दिसंबर'], ['14 October', '14 अक्टूबर']],
        answer: 2,
        whyEn: 'Babasaheb passed away on 6 December 1956 in Delhi. Lakhs gather at Chaityabhoomi, Mumbai, every year on this day.',
        whyHi: 'बाबासाहेब का निधन 6 दिसंबर 1956 को दिल्ली में हुआ। इस दिन हर साल लाखों लोग मुंबई की चैत्यभूमि पर जुटते हैं।',
    },
    {
        level: 'easy',
        qEn: 'Who wrote the famous book "Annihilation of Caste"?',
        qHi: 'प्रसिद्ध पुस्तक "जाति का विनाश" (Annihilation of Caste) किसने लिखी?',
        options: [['Mahatma Gandhi', 'महात्मा गांधी'], ['Jyotirao Phule', 'ज्योतिराव फुले'], ['Dr. B. R. Ambedkar', 'डॉ. बी. आर. आंबेडकर'], ['Periyar', 'पेरियार']],
        answer: 2,
        whyEn: 'Dr. Ambedkar wrote it in 1936 as a speech. When the organisers would not let him give it, he printed it himself.',
        whyHi: 'डॉ. आंबेडकर ने इसे 1936 में एक भाषण के रूप में लिखा था। आयोजकों ने भाषण नहीं होने दिया, तो उन्होंने इसे स्वयं छपवाया।',
    },
    {
        level: 'easy',
        qEn: 'Dr. Ambedkar is often called the father of what?',
        qHi: 'डॉ. आंबेडकर को अक्सर किसका जनक कहा जाता है?',
        options: [['The Indian Constitution', 'भारतीय संविधान'], ['The Green Revolution', 'हरित क्रांति'], ['Indian cinema', 'भारतीय सिनेमा'], ['The Indian Railways', 'भारतीय रेल']],
        answer: 0,
        whyEn: 'As Chairman of the Drafting Committee, he is honoured as the father (chief architect) of the Indian Constitution.',
        whyHi: 'प्रारूप समिति के अध्यक्ष के रूप में उन्हें भारतीय संविधान का जनक (मुख्य शिल्पकार) माना जाता है।',
    },
    // ---------- Medium ----------
    {
        level: 'medium',
        qEn: 'In which city did Dr. Ambedkar embrace Buddhism with lakhs of followers in 1956?',
        qHi: '1956 में डॉ. आंबेडकर ने लाखों अनुयायियों के साथ किस शहर में बौद्ध धम्म अपनाया?',
        options: [['Nagpur', 'नागपुर'], ['Mumbai', 'मुंबई'], ['Bodh Gaya', 'बोधगया'], ['Pune', 'पुणे']],
        answer: 0,
        whyEn: 'On 14 October 1956 at Nagpur. The place is now called Deekshabhoomi.',
        whyHi: '14 अक्टूबर 1956 को नागपुर में। उस जगह को अब दीक्षाभूमि कहा जाता है।',
    },
    {
        level: 'medium',
        qEn: 'What was the Mahad Satyagraha of 1927 led by Dr. Ambedkar about?',
        qHi: '1927 में डॉ. आंबेडकर के नेतृत्व में हुआ महाड़ सत्याग्रह किस बारे में था?',
        options: [['The right to drink water from a public tank', 'सार्वजनिक तालाब से पानी पीने का अधिकार'], ['Lower taxes on salt', 'नमक पर कम कर'], ['Freedom of the press', 'प्रेस की स्वतंत्रता'], ['Higher wages for mill workers', 'मिल मज़दूरों का अधिक वेतन']],
        answer: 0,
        whyEn: 'At Mahad, Babasaheb led thousands to drink water from the Chavdar tank, which "untouchables" had been barred from using.',
        whyHi: 'महाड़ में बाबासाहेब ने हज़ारों लोगों के साथ चवदार तालाब का पानी पिया, जिसका उपयोग "अछूतों" के लिए वर्जित था।',
    },
    {
        level: 'medium',
        qEn: 'In which Part of the Constitution are the Fundamental Rights?',
        qHi: 'मौलिक अधिकार संविधान के किस भाग में हैं?',
        options: [['Part I', 'भाग 1'], ['Part III', 'भाग 3'], ['Part IV', 'भाग 4'], ['Part IX', 'भाग 9']],
        answer: 1,
        whyEn: 'Part III (Articles 12 to 35) contains the Fundamental Rights.',
        whyHi: 'भाग 3 (अनुच्छेद 12 से 35) में मौलिक अधिकार हैं।',
    },
    {
        level: 'medium',
        qEn: 'Which Article guarantees "equality before the law" to every person?',
        qHi: 'कौन-सा अनुच्छेद हर व्यक्ति को "कानून के समक्ष समानता" की गारंटी देता है?',
        options: [['Article 14', 'अनुच्छेद 14'], ['Article 19', 'अनुच्छेद 19'], ['Article 25', 'अनुच्छेद 25'], ['Article 44', 'अनुच्छेद 44']],
        answer: 0,
        whyEn: 'Article 14: the State shall not deny to any person equality before the law or the equal protection of the laws.',
        whyHi: 'अनुच्छेद 14: राज्य किसी भी व्यक्ति को कानून के समक्ष समानता या कानूनों के समान संरक्षण से वंचित नहीं करेगा।',
    },
    {
        level: 'medium',
        qEn: 'Article 21A gives children the right to free and compulsory education. For which ages?',
        qHi: 'अनुच्छेद 21A बच्चों को मुफ़्त और अनिवार्य शिक्षा का अधिकार देता है। किस उम्र के बच्चों को?',
        options: [['3 to 10 years', '3 से 10 वर्ष'], ['6 to 14 years', '6 से 14 वर्ष'], ['5 to 18 years', '5 से 18 वर्ष'], ['10 to 16 years', '10 से 16 वर्ष']],
        answer: 1,
        whyEn: 'Children aged 6 to 14. It was added by the 86th Amendment in 2002.',
        whyHi: '6 से 14 वर्ष के बच्चों को। इसे 2002 में 86वें संशोधन से जोड़ा गया।',
    },
    {
        level: 'medium',
        qEn: 'Which newspaper did Dr. Ambedkar start in 1920?',
        qHi: '1920 में डॉ. आंबेडकर ने कौन-सा अख़बार शुरू किया?',
        options: [['Kesari', 'केसरी'], ['Young India', 'यंग इंडिया'], ['Mooknayak', 'मूकनायक'], ['Harijan', 'हरिजन']],
        answer: 2,
        whyEn: 'Mooknayak ("leader of the voiceless") was his first newspaper, in Marathi.',
        whyHi: 'मूकनायक ("बेज़ुबानों का नायक") उनका पहला अख़बार था, जो मराठी में निकलता था।',
    },
    {
        level: 'medium',
        qEn: 'The Poona Pact of 1932 was an agreement between Dr. Ambedkar and whom?',
        qHi: '1932 का पूना पैक्ट डॉ. आंबेडकर और किसके बीच एक समझौता था?',
        options: [['Jawaharlal Nehru', 'जवाहरलाल नेहरू'], ['Mahatma Gandhi', 'महात्मा गांधी'], ['Muhammad Ali Jinnah', 'मुहम्मद अली जिन्ना'], ['Lord Irwin', 'लॉर्ड इरविन']],
        answer: 1,
        whyEn: 'It was made after Gandhi\'s fast against separate electorates, and gave reserved seats in joint electorates instead.',
        whyHi: 'यह पृथक निर्वाचन के विरोध में गांधी के अनशन के बाद हुआ, और इसके बदले संयुक्त निर्वाचन में आरक्षित सीटें मिलीं।',
    },
    {
        level: 'medium',
        qEn: 'At which university in the USA did Dr. Ambedkar study and earn his doctorate?',
        qHi: 'डॉ. आंबेडकर ने अमेरिका के किस विश्वविद्यालय में पढ़ाई की और डॉक्टरेट पाई?',
        options: [['Harvard University', 'हार्वर्ड विश्वविद्यालय'], ['Columbia University', 'कोलंबिया विश्वविद्यालय'], ['Yale University', 'येल विश्वविद्यालय'], ['Stanford University', 'स्टैनफ़र्ड विश्वविद्यालय']],
        answer: 1,
        whyEn: 'Columbia University in New York. He later also earned a doctorate from the London School of Economics.',
        whyHi: 'न्यूयॉर्क की कोलंबिया यूनिवर्सिटी में। बाद में उन्होंने लंदन स्कूल ऑफ़ इकोनॉमिक्स से भी डॉक्टरेट पाई।',
    },
    {
        level: 'medium',
        qEn: 'What is the minimum age to become a member of the Lok Sabha?',
        qHi: 'लोकसभा का सदस्य बनने की न्यूनतम उम्र क्या है?',
        options: [['18 years', '18 वर्ष'], ['21 years', '21 वर्ष'], ['25 years', '25 वर्ष'], ['30 years', '30 वर्ष']],
        answer: 2,
        whyEn: 'A candidate for the Lok Sabha must be at least 25 years old (for the Rajya Sabha, 30).',
        whyHi: 'लोकसभा के उम्मीदवार की उम्र कम से कम 25 वर्ष होनी चाहिए (राज्यसभा के लिए 30 वर्ष)।',
    },
    {
        level: 'medium',
        qEn: 'In which year was Dr. Ambedkar given the Bharat Ratna?',
        qHi: 'डॉ. आंबेडकर को भारत रत्न किस वर्ष दिया गया?',
        options: [['1956', '1956'], ['1971', '1971'], ['1990', '1990'], ['2015', '2015']],
        answer: 2,
        whyEn: 'He was given the Bharat Ratna, India\'s highest civilian award, after his death, in 1990.',
        whyHi: 'उन्हें भारत का सर्वोच्च नागरिक सम्मान भारत रत्न उनके निधन के बाद, 1990 में दिया गया।',
    },
    // ---------- Hard ----------
    {
        level: 'hard',
        qEn: 'In which year were the Fundamental Duties added to the Constitution?',
        qHi: 'मौलिक कर्तव्य संविधान में किस वर्ष जोड़े गए?',
        options: [['1950', '1950'], ['1976', '1976'], ['1978', '1978'], ['2002', '2002']],
        answer: 1,
        whyEn: 'In 1976, by the 42nd Amendment, as Part IVA (Article 51A).',
        whyHi: '1976 में, 42वें संशोधन द्वारा, भाग 4क (अनुच्छेद 51क) के रूप में।',
    },
    {
        level: 'hard',
        qEn: 'Which right was removed from the list of Fundamental Rights by the 44th Amendment in 1978?',
        qHi: '1978 में 44वें संशोधन द्वारा कौन-सा अधिकार मौलिक अधिकारों की सूची से हटाया गया?',
        options: [['Right to equality', 'समानता का अधिकार'], ['Right to property', 'संपत्ति का अधिकार'], ['Right to freedom of religion', 'धर्म की स्वतंत्रता का अधिकार'], ['Right against exploitation', 'शोषण के विरुद्ध अधिकार']],
        answer: 1,
        whyEn: 'The right to property is now a legal right under Article 300A, not a Fundamental Right.',
        whyHi: 'संपत्ति का अधिकार अब अनुच्छेद 300क के तहत एक कानूनी अधिकार है, मौलिक अधिकार नहीं।',
    },
    {
        level: 'hard',
        qEn: 'Which Amendment lowered the voting age from 21 to 18?',
        qHi: 'किस संशोधन ने वोट देने की उम्र 21 से घटाकर 18 वर्ष की?',
        options: [['42nd Amendment', '42वाँ संशोधन'], ['44th Amendment', '44वाँ संशोधन'], ['61st Amendment', '61वाँ संशोधन'], ['73rd Amendment', '73वाँ संशोधन']],
        answer: 2,
        whyEn: 'The 61st Amendment, passed in 1988.',
        whyHi: '61वाँ संशोधन, जो 1988 में पारित हुआ।',
    },
    {
        level: 'hard',
        qEn: 'When did the Constituent Assembly meet for the first time?',
        qHi: 'संविधान सभा की पहली बैठक कब हुई?',
        options: [['15 August 1947', '15 अगस्त 1947'], ['9 December 1946', '9 दिसंबर 1946'], ['26 January 1946', '26 जनवरी 1946'], ['29 August 1947', '29 अगस्त 1947']],
        answer: 1,
        whyEn: 'It first met on 9 December 1946 in New Delhi. The Drafting Committee was set up on 29 August 1947.',
        whyHi: 'इसकी पहली बैठक 9 दिसंबर 1946 को नई दिल्ली में हुई। प्रारूप समिति 29 अगस्त 1947 को बनी।',
    },
    {
        level: 'hard',
        qEn: 'Who handwrote the original English copy of the Constitution in beautiful calligraphy?',
        qHi: 'संविधान की मूल अंग्रेज़ी प्रति को सुंदर अक्षरों में हाथ से किसने लिखा?',
        options: [['Nandalal Bose', 'नंदलाल बोस'], ['Prem Behari Narain Raizada', 'प्रेम बिहारी नारायण रायज़ादा'], ['Raja Ravi Varma', 'राजा रवि वर्मा'], ['B. N. Rau', 'बी. एन. राउ']],
        answer: 1,
        whyEn: 'Prem Behari Narain Raizada wrote it by hand. Artists led by Nandalal Bose decorated its pages.',
        whyHi: 'प्रेम बिहारी नारायण रायज़ादा ने इसे हाथ से लिखा। नंदलाल बोस के नेतृत्व में कलाकारों ने इसके पन्ने सजाए।',
    },
    {
        level: 'hard',
        qEn: 'Over which bill did Dr. Ambedkar resign as Law Minister in 1951?',
        qHi: '1951 में डॉ. आंबेडकर ने किस विधेयक के कारण कानून मंत्री पद से इस्तीफ़ा दिया?',
        options: [['The Hindu Code Bill', 'हिंदू कोड बिल'], ['The Zamindari Abolition Bill', 'ज़मींदारी उन्मूलन विधेयक'], ['The Official Language Bill', 'राजभाषा विधेयक'], ['The Press Bill', 'प्रेस विधेयक']],
        answer: 0,
        whyEn: 'The Hindu Code Bill would have given women equal rights in marriage and property. He resigned when it was held back.',
        whyHi: 'हिंदू कोड बिल महिलाओं को विवाह और संपत्ति में बराबर अधिकार देता। इसके रोक दिए जाने पर उन्होंने इस्तीफ़ा दिया।',
    },
    {
        level: 'hard',
        qEn: 'In which year was the SC/ST (Prevention of Atrocities) Act passed?',
        qHi: 'अनुसूचित जाति/जनजाति (अत्याचार निवारण) अधिनियम किस वर्ष पारित हुआ?',
        options: [['1955', '1955'], ['1976', '1976'], ['1989', '1989'], ['2005', '2005']],
        answer: 2,
        whyEn: 'It was passed in 1989 to prevent atrocities against Scheduled Castes and Scheduled Tribes.',
        whyHi: 'यह 1989 में अनुसूचित जातियों और जनजातियों पर अत्याचार रोकने के लिए पारित हुआ।',
    },
    {
        level: 'hard',
        qEn: 'Article 1 of the Constitution says "India, that is Bharat, shall be a…"',
        qHi: 'संविधान का अनुच्छेद 1 कहता है "भारत, अर्थात इंडिया, … होगा।"',
        options: [['Federation of Provinces', 'प्रांतों का संघ'], ['Union of States', 'राज्यों का संघ'], ['Republic of People', 'लोगों का गणराज्य'], ['Commonwealth of States', 'राज्यों का राष्ट्रमंडल']],
        answer: 1,
        whyEn: '"India, that is Bharat, shall be a Union of States."',
        whyHi: '"भारत, अर्थात इंडिया, राज्यों का संघ होगा।"',
    },
    {
        level: 'hard',
        qEn: 'Which Article gives Parliament the power to amend the Constitution?',
        qHi: 'कौन-सा अनुच्छेद संसद को संविधान में संशोधन करने की शक्ति देता है?',
        options: [['Article 352', 'अनुच्छेद 352'], ['Article 356', 'अनुच्छेद 356'], ['Article 368', 'अनुच्छेद 368'], ['Article 370', 'अनुच्छेद 370']],
        answer: 2,
        whyEn: 'Article 368. Article 352 is about a national emergency and 356 about President\'s Rule in a state.',
        whyHi: 'अनुच्छेद 368। अनुच्छेद 352 राष्ट्रीय आपातकाल और 356 किसी राज्य में राष्ट्रपति शासन के बारे में है।',
    },
]

// How many questions of each level one game has (4 + 4 + 2 = 10)
export const QUIZ_MIX = { easy: 4, medium: 4, hard: 2 }
export const QUIZ_SIZE = QUIZ_MIX.easy + QUIZ_MIX.medium + QUIZ_MIX.hard

// A small random number maker that gives the same numbers for the same seed (mulberry32).
// A challenge link carries the seed (?q=1234), so a friend gets exactly the same questions.
function seeded(seed) {
    let a = seed >>> 0
    return () => {
        a = (a + 0x6d2b79f5) >>> 0
        let t = a
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}
function shuffle(list, rand) {
    const a = [...list]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
export const newQuizSeed = () => 1 + Math.floor(Math.random() * 999999)
export const isQuizSeed = (v) => /^[1-9]\d{0,5}$/.test(String(v || ''))

// The questions for one game: easy, then medium, then hard, with the answers in a shuffled order
export function pickQuiz(seed) {
    const rand = seeded(seed)
    return ['easy', 'medium', 'hard'].flatMap((level) =>
        shuffle(QUIZ.filter((q) => q.level === level), rand).slice(0, QUIZ_MIX[level]).map((q) => {
            const order = shuffle(q.options.map((_, i) => i), rand)
            return { ...q, options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
        }))
}
