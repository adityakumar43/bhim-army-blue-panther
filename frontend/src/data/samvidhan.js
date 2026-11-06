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

// The quiz: answer = the number of the right option (0 = the first)
export const QUIZ = [
    {
        qEn: 'On which date did the Constituent Assembly adopt the Constitution of India?',
        qHi: 'संविधान सभा ने भारत का संविधान किस तारीख को अपनाया?',
        options: [['15 August 1947', '15 अगस्त 1947'], ['26 November 1949', '26 नवंबर 1949'], ['26 January 1950', '26 जनवरी 1950'], ['9 December 1946', '9 दिसंबर 1946']],
        answer: 1,
        whyEn: 'It was adopted on 26 November 1949, which is why this day is Samvidhan Divas.',
        whyHi: 'यह 26 नवंबर 1949 को अपनाया गया था, इसलिए यह दिन संविधान दिवस है।',
    },
    {
        qEn: 'When did the Constitution come into force?',
        qHi: 'संविधान कब लागू हुआ?',
        options: [['26 January 1950', '26 जनवरी 1950'], ['15 August 1950', '15 अगस्त 1950'], ['26 November 1950', '26 नवंबर 1950'], ['2 October 1949', '2 अक्टूबर 1949']],
        answer: 0,
        whyEn: 'It came into force on 26 January 1950, celebrated as Republic Day.',
        whyHi: 'यह 26 जनवरी 1950 को लागू हुआ, जिसे गणतंत्र दिवस के रूप में मनाया जाता है।',
    },
    {
        qEn: 'Who was the Chairman of the Drafting Committee of the Constitution?',
        qHi: 'संविधान की प्रारूप समिति के अध्यक्ष कौन थे?',
        options: [['Dr. Rajendra Prasad', 'डॉ. राजेंद्र प्रसाद'], ['Jawaharlal Nehru', 'जवाहरलाल नेहरू'], ['Dr. B. R. Ambedkar', 'डॉ. बी. आर. आंबेडकर'], ['Sardar Vallabhbhai Patel', 'सरदार वल्लभभाई पटेल']],
        answer: 2,
        whyEn: 'Dr. B. R. Ambedkar chaired the Drafting Committee and is called the chief architect of the Constitution.',
        whyHi: 'डॉ. बी. आर. आंबेडकर प्रारूप समिति के अध्यक्ष थे और उन्हें संविधान का मुख्य शिल्पकार कहा जाता है।',
    },
    {
        qEn: 'Who was the President of the Constituent Assembly?',
        qHi: 'संविधान सभा के अध्यक्ष कौन थे?',
        options: [['Dr. Rajendra Prasad', 'डॉ. राजेंद्र प्रसाद'], ['Dr. B. R. Ambedkar', 'डॉ. बी. आर. आंबेडकर'], ['Maulana Abul Kalam Azad', 'मौलाना अबुल कलाम आज़ाद'], ['C. Rajagopalachari', 'सी. राजगोपालाचारी']],
        answer: 0,
        whyEn: 'Dr. Rajendra Prasad presided over the Constituent Assembly and later became India\'s first President.',
        whyHi: 'डॉ. राजेंद्र प्रसाद संविधान सभा के अध्यक्ष थे और बाद में भारत के पहले राष्ट्रपति बने।',
    },
    {
        qEn: 'Which Article of the Constitution abolishes untouchability?',
        qHi: 'संविधान का कौन-सा अनुच्छेद अस्पृश्यता (छुआछूत) को समाप्त करता है?',
        options: [['Article 14', 'अनुच्छेद 14'], ['Article 17', 'अनुच्छेद 17'], ['Article 21', 'अनुच्छेद 21'], ['Article 32', 'अनुच्छेद 32']],
        answer: 1,
        whyEn: 'Article 17 abolishes untouchability and forbids its practice in any form.',
        whyHi: 'अनुच्छेद 17 अस्पृश्यता को समाप्त करता है और किसी भी रूप में इसके आचरण को वर्जित करता है।',
    },
    {
        qEn: 'Which Article did Dr. Ambedkar call "the very soul of the Constitution and the very heart of it"?',
        qHi: 'डॉ. आंबेडकर ने किस अनुच्छेद को "संविधान की आत्मा और हृदय" कहा?',
        options: [['Article 19', 'अनुच्छेद 19'], ['Article 21', 'अनुच्छेद 21'], ['Article 32', 'अनुच्छेद 32'], ['Article 370', 'अनुच्छेद 370']],
        answer: 2,
        whyEn: 'Article 32 lets every person go straight to the Supreme Court to protect their Fundamental Rights.',
        whyHi: 'अनुच्छेद 32 हर व्यक्ति को अपने मौलिक अधिकारों की रक्षा के लिए सीधे सर्वोच्च न्यायालय जाने का अधिकार देता है।',
    },
    {
        qEn: 'Which words were added to the Preamble by the 42nd Amendment in 1976?',
        qHi: '1976 में 42वें संशोधन द्वारा उद्देशिका में कौन-से शब्द जोड़े गए?',
        options: [['Sovereign and Democratic', 'संप्रभु और लोकतांत्रिक'], ['Justice and Liberty', 'न्याय और स्वतंत्रता'], ['Socialist and Secular', 'समाजवादी और पंथनिरपेक्ष'], ['Republic and Fraternity', 'गणराज्य और बंधुता']],
        answer: 2,
        whyEn: '"Socialist", "Secular" and "integrity" were added to the Preamble by the 42nd Amendment.',
        whyHi: '42वें संशोधन से उद्देशिका में "समाजवादी", "पंथनिरपेक्ष" और "अखंडता" शब्द जोड़े गए।',
    },
    {
        qEn: 'About how long did it take to make the Constitution?',
        qHi: 'संविधान बनाने में लगभग कितना समय लगा?',
        options: [['1 year', '1 वर्ष'], ['2 years, 11 months and 18 days', '2 वर्ष, 11 महीने और 18 दिन'], ['5 years', '5 वर्ष'], ['6 months', '6 महीने']],
        answer: 1,
        whyEn: 'The Constituent Assembly took 2 years, 11 months and 18 days.',
        whyHi: 'संविधान सभा को 2 वर्ष, 11 महीने और 18 दिन लगे।',
    },
    {
        qEn: 'Where was Dr. B. R. Ambedkar born?',
        qHi: 'डॉ. बी. आर. आंबेडकर का जन्म कहाँ हुआ था?',
        options: [['Nagpur, Maharashtra', 'नागपुर, महाराष्ट्र'], ['Mhow, Madhya Pradesh', 'महू, मध्य प्रदेश'], ['Mumbai, Maharashtra', 'मुंबई, महाराष्ट्र'], ['Delhi', 'दिल्ली']],
        answer: 1,
        whyEn: 'He was born on 14 April 1891 in Mhow, now called Dr. Ambedkar Nagar, in Madhya Pradesh.',
        whyHi: 'उनका जन्म 14 अप्रैल 1891 को महू में हुआ था, जिसे अब डॉ. आंबेडकर नगर कहा जाता है (मध्य प्रदेश)।',
    },
    {
        qEn: 'Since which year has 26 November been officially celebrated as Constitution Day?',
        qHi: '26 नवंबर को आधिकारिक रूप से संविधान दिवस कब से मनाया जाता है?',
        options: [['1950', '1950'], ['1976', '1976'], ['2015', '2015'], ['2020', '2020']],
        answer: 2,
        whyEn: 'Since 2015, the 125th birth anniversary year of Dr. Ambedkar.',
        whyHi: '2015 से, जो डॉ. आंबेडकर की 125वीं जयंती का वर्ष था।',
    },
]
