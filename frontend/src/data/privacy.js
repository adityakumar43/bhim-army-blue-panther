// The Privacy Policy, in Hindi and English. Change the wording here; the page shows it as it is.
// Have someone in the organisation (ideally a lawyer) read it before the website goes live.

export const PRIVACY_UPDATED = '2026-11-04' // change this date whenever you change the policy

// The person who answers privacy questions and complaints (the "grievance officer").
// Fill these in before going live. While the email is empty, the page points people to the Contact page.
export const GRIEVANCE = {
    name: '', // e.g. 'Shri Ramesh Kumar'
    title: '', // e.g. 'Data Protection Officer, Bhim Army Blue Panther'
    email: '', // e.g. 'privacy@yourdomain.org'
    phone: '', // optional
}

export const PRIVACY = {
    en: [
        {
            id: 'who',
            title: 'Who we are',
            body: [
                'Bhim Army Blue Panther ("we", "us") runs this website. This policy explains what personal data we collect through the website, why we collect it, who can see it and what your rights are. We follow the Digital Personal Data Protection Act, 2023.',
            ],
        },
        {
            id: 'what',
            title: 'What we collect',
            list: [
                ['Membership (Join)', 'name, mobile number, email, date of birth, city, district and state, assembly and Lok Sabha constituency numbers (if you give them), your photo and your message.'],
                ['Help desk', 'name, mobile number, email (if you give it), state, district, village and police station, what happened, and any photos, documents or voice message you send.'],
                ['Volunteer', 'name, mobile number, email (if you give it), state and district, how you can help, when you are free and your message.'],
                ['Contact form', 'name, mobile number or email, and your message.'],
                ['Donations', 'name, mobile number and email (all optional) and the amount. Your card, UPI or bank details go only to Razorpay, our payment company. We never see or keep them.'],
                ['Event registration', 'name, mobile number, district (if you give it) and how many people are coming.'],
                ['Event check-in', 'when a volunteer scans your membership card (or types your member number) at an event, we note the event, the time, your name, member number and district, and which team member let you in.'],
                ['Polls', 'when you answer a poll, we check your member number and mobile number, and keep the answer you chose with your membership, state and district, so that each member can answer only once.'],
                ['Updating your details', 'to let you change your own details, we check your mobile number and date of birth and send a one-time code to the email on your membership. We note the date you last updated your details.'],
                ['Notifications', 'if you allow notifications, your browser gives us an address to send them to. We keep only that address and your language, nothing else about you. You can turn notifications off at any time in your browser.'],
                ['Visitor numbers', 'we count how many people open each page each day, with the kind of device, the language and the website that sent them. We keep only totals: no names, no IP addresses, no cookies. To count each visitor once a day we use a scrambled code that cannot be traced back to you, and it is deleted after two days.'],
                ['Google Analytics', 'we use Google Analytics to understand how people find and use the website: which pages are opened, the rough area (city or state), the kind of device and browser, and the website that sent you. It sets cookies in your browser for this. It never receives what you type in our forms, such as your name, mobile number or complaint. It is not used on the admin panel, and it is switched off if your browser asks websites not to track you.'],
                ['On your device', 'the website remembers small things in your browser, such as your language, a half-filled form, or your last complaint number. Apart from the Google Analytics cookies described above, we do not use advertising or tracking cookies.'],
            ],
        },
        {
            id: 'why',
            title: 'Why we use it',
            list: [
                ['Membership', 'to check your application, give you a membership number and card, send you your card and birthday wishes by email, and keep in touch about the organisation\'s work.'],
                ['Help desk', 'to understand your problem, contact you and help you. When it is needed to help you, we may share the necessary details with a lawyer, or with the police or a government office, as part of the help you asked for.'],
                ['Volunteers', 'to contact you about work and events near you.'],
                ['Messages and donations', 'to reply to you and to send your donation receipt.'],
                ['Events', 'to plan events, let members in quickly at the gate, know how many came, and see how many events each member has attended, so the organisation knows its active members.'],
                ['Polls', 'to hear what members think. The team sees only the totals, overall and by state and district, never which member chose which answer.'],
                ['Notifications and visitor numbers', 'to tell you about news, events and important updates, and to understand which pages are useful so we can improve the website.'],
            ],
            after: ['We use your data only for these purposes. We never sell or rent it to anyone.'],
        },
        {
            id: 'consent',
            title: 'Your consent',
            body: [
                'Before you send a form, we ask you to tick a box to agree to this policy. You can withdraw your consent at any time by writing to us (see "Contact us" below). If you withdraw consent for membership, your membership ends.',
            ],
        },
        {
            id: 'see',
            title: 'Who can see your data',
            list: [
                ['Our team', 'only team members who need it for their work, and each person sees only what their role allows. A state admin sees only their own state, and a district admin only their own district. A gate volunteer at an event sees only the name, photo, member number and place of the member whose card they scan.'],
                ['Membership card', 'your card page shows your name, photo, state, member number and the date you joined to anyone who opens your card link or scans its QR code. Your mobile number, email, date of birth and address are never shown there.'],
                ['Certificates and letters', 'the check page of a certificate or letter shows what is printed on it.'],
                ['Service providers', 'we use trusted services to run the website: a database host (MongoDB Atlas), Cloudinary (for photos and voice messages), an email service (to send emails), Razorpay (for payments), Google Analytics (to count visits) and the notification service of your browser company, such as Google, Apple or Mozilla (to deliver notifications). They keep the data only to provide their service to us.'],
                ['When the law requires it', 'we may share data if a court or the law requires us to.'],
            ],
        },
        {
            id: 'keep',
            title: 'How long we keep it',
            body: [
                'We keep your data only as long as it is needed for the purpose you gave it for: membership data while you are a member, help desk cases until they are closed and for some time after for our records, and messages until we have replied. Donation records are kept as long as the law requires for accounts.  Event check-ins and poll answers are kept with your membership, and are deleted when the check-in list of that event, or the poll, is deleted. A notification address is removed when it stops working, for example when you turn notifications off. After that, we delete the data or remove the parts that identify you.',
            ],
        },
        {
            id: 'safe',
            title: 'How we keep it safe',
            body: [
                'The website uses a secure (HTTPS) connection. Only our team can log in to the admin panel, with strong passwords and two-step login for important roles, and each person can only see what their role allows. Important changes made in the admin panel are recorded. No system is perfectly safe, but if a breach ever affects your data, we will inform you and the authorities as the law requires.',
            ],
        },
        {
            id: 'rights',
            title: 'Your rights',
            list: [
                ['Know', 'ask us what personal data we have about you and how we use it.'],
                ['Correct', 'ask us to correct or complete wrong or old data. Members can also change their mobile number, email, address and photo themselves on the "Update my details" page.'],
                ['Delete', 'ask us to delete your data when it is no longer needed (unless the law requires us to keep it).'],
                ['Withdraw consent', 'stop us from using your data from now on.'],
                ['Complain', 'complain to us first. If you are not satisfied with our reply, you can complain to the Data Protection Board of India.'],
                ['Nominate', 'name a person who can use these rights for you in case of death or incapacity.'],
            ],
        },
        {
            id: 'age',
            title: 'Children',
            body: [
                'Only people aged 18 or above can become members. If someone under 18 needs help from our help desk, a parent or guardian should fill the form for them.',
            ],
        },
        {
            id: 'contact',
            title: 'Contact us',
            body: ['For any question, request or complaint about your personal data, write to:'],
            grievance: true,
        },
        {
            id: 'changes',
            title: 'Changes to this policy',
            body: ['We may update this policy. The date at the top shows when it was last changed.'],
        },
    ],

    hi: [
        {
            id: 'who',
            title: 'हम कौन हैं',
            body: [
                'यह वेबसाइट भीम आर्मी ब्लू पैंथर ("हम") चलाती है। यह नीति बताती है कि हम वेबसाइट के ज़रिए कौन-सी निजी जानकारी लेते हैं, क्यों लेते हैं, उसे कौन देख सकता है और आपके क्या अधिकार हैं। हम डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 का पालन करते हैं।',
            ],
        },
        {
            id: 'what',
            title: 'हम कौन-सी जानकारी लेते हैं',
            list: [
                ['सदस्यता (जुड़ें)', 'नाम, मोबाइल नंबर, ईमेल, जन्म तिथि, शहर, ज़िला और प्रदेश, विधानसभा और लोकसभा क्षेत्र संख्या (अगर आप दें), आपकी फ़ोटो और आपका संदेश।'],
                ['सहायता केंद्र', 'नाम, मोबाइल नंबर, ईमेल (अगर आप दें), प्रदेश, ज़िला, गाँव और पुलिस थाना, क्या हुआ उसका विवरण, और आपके भेजे फ़ोटो, दस्तावेज़ या आवाज़ संदेश।'],
                ['स्वयंसेवक', 'नाम, मोबाइल नंबर, ईमेल (अगर आप दें), प्रदेश और ज़िला, आप कैसे मदद कर सकते हैं, आप कब समय दे सकते हैं और आपका संदेश।'],
                ['संपर्क फ़ॉर्म', 'नाम, मोबाइल नंबर या ईमेल, और आपका संदेश।'],
                ['दान', 'नाम, मोबाइल नंबर और ईमेल (सब वैकल्पिक) और राशि। आपके कार्ड, UPI या बैंक की जानकारी सिर्फ़ हमारी भुगतान कंपनी Razorpay के पास जाती है। हम उसे न देखते हैं, न रखते हैं।'],
                ['कार्यक्रम पंजीकरण', 'नाम, मोबाइल नंबर, ज़िला (अगर आप दें) और कितने लोग आ रहे हैं।'],
                ['कार्यक्रम में चेक-इन', 'जब किसी कार्यक्रम में स्वयंसेवक आपका सदस्यता कार्ड स्कैन करता है (या आपकी सदस्य संख्या डालता है), तो हम कार्यक्रम, समय, आपका नाम, सदस्य संख्या और ज़िला, और आपको अंदर आने देने वाले टीम सदस्य का नाम दर्ज करते हैं।'],
                ['मतदान (पोल)', 'जब आप किसी पोल में जवाब देते हैं, तो हम आपकी सदस्य संख्या और मोबाइल नंबर की जाँच करते हैं, और आपका चुना हुआ जवाब आपकी सदस्यता, प्रदेश और ज़िले के साथ रखते हैं, ताकि हर सदस्य सिर्फ़ एक बार जवाब दे सके।'],
                ['अपनी जानकारी बदलना', 'आपको अपनी जानकारी खुद बदलने देने के लिए, हम आपका मोबाइल नंबर और जन्म तिथि जाँचते हैं और आपकी सदस्यता वाले ईमेल पर एक बार इस्तेमाल होने वाला कोड भेजते हैं। आपने आख़िरी बार जानकारी कब बदली, उसकी तारीख हम दर्ज करते हैं।'],
                ['सूचनाएँ (नोटिफ़िकेशन)', 'अगर आप सूचनाएँ चालू करते हैं, तो आपका ब्राउज़र हमें उन्हें भेजने का एक पता देता है। हम सिर्फ़ वह पता और आपकी भाषा रखते हैं, आपके बारे में और कुछ नहीं। आप कभी भी अपने ब्राउज़र में सूचनाएँ बंद कर सकते हैं।'],
                ['विज़िटर गिनती', 'हम गिनते हैं कि हर दिन कितने लोग कौन-सा पेज खोलते हैं, किस तरह के डिवाइस से, किस भाषा में और किस वेबसाइट से आकर। हम सिर्फ़ कुल संख्या रखते हैं: न नाम, न IP पता, न कुकीज़। हर विज़िटर को दिन में एक बार गिनने के लिए हम एक बदला हुआ कोड इस्तेमाल करते हैं, जिससे आपकी पहचान नहीं हो सकती, और वह दो दिन बाद हट जाता है।'],
                ['Google Analytics', 'लोग वेबसाइट तक कैसे पहुँचते हैं और उसका कैसे उपयोग करते हैं, यह समझने के लिए हम Google Analytics का उपयोग करते हैं: कौन-से पेज खोले गए, मोटा-मोटा इलाका (शहर या प्रदेश), डिवाइस और ब्राउज़र का प्रकार, और किस वेबसाइट से आप आए। इसके लिए यह आपके ब्राउज़र में कुकीज़ रखता है। आप हमारे फ़ॉर्म में जो लिखते हैं, जैसे नाम, मोबाइल नंबर या शिकायत, वह इसे कभी नहीं मिलता। एडमिन पैनल पर इसका उपयोग नहीं होता, और अगर आपका ब्राउज़र वेबसाइटों से ट्रैक न करने को कहता है तो यह बंद रहता है।'],
                ['आपके फ़ोन/कंप्यूटर पर', 'वेबसाइट आपके ब्राउज़र में छोटी चीज़ें याद रखती है, जैसे आपकी भाषा, आधा भरा फ़ॉर्म, या आपकी पिछली शिकायत संख्या। ऊपर बताई गई Google Analytics कुकीज़ के अलावा हम विज्ञापन या ट्रैकिंग वाली कुकीज़ का इस्तेमाल नहीं करते।'],
            ],
        },
        {
            id: 'why',
            title: 'हम इसका उपयोग क्यों करते हैं',
            list: [
                ['सदस्यता', 'आपके आवेदन की जाँच करने, आपको सदस्यता संख्या और कार्ड देने, ईमेल से आपका कार्ड और जन्मदिन की शुभकामनाएँ भेजने, और संगठन के काम के बारे में संपर्क में रहने के लिए।'],
                ['सहायता केंद्र', 'आपकी समस्या समझने, आपसे संपर्क करने और आपकी मदद करने के लिए। आपकी मदद के लिए ज़रूरी होने पर, हम ज़रूरी जानकारी किसी वकील, पुलिस या सरकारी दफ़्तर के साथ साझा कर सकते हैं, उसी मदद के हिस्से के रूप में जो आपने माँगी है।'],
                ['स्वयंसेवक', 'आपके पास होने वाले कामों और कार्यक्रमों के बारे में आपसे संपर्क करने के लिए।'],
                ['संदेश और दान', 'आपको जवाब देने और आपके दान की रसीद भेजने के लिए।'],
                ['कार्यक्रम', 'कार्यक्रमों की योजना बनाने, गेट पर सदस्यों को जल्दी अंदर आने देने, यह जानने कि कितने लोग आए, और यह देखने कि हर सदस्य कितने कार्यक्रमों में आया है, ताकि संगठन अपने सक्रिय सदस्यों को जान सके।'],
                ['मतदान (पोल)', 'सदस्यों की राय जानने के लिए। टीम सिर्फ़ कुल संख्या देखती है, पूरे देश की और प्रदेश व ज़िले के हिसाब से, कभी यह नहीं कि किस सदस्य ने कौन-सा जवाब चुना।'],
                ['सूचनाएँ और विज़िटर गिनती', 'आपको ख़बरों, कार्यक्रमों और ज़रूरी अपडेट के बारे में बताने के लिए, और यह समझने के लिए कि कौन-से पेज काम के हैं ताकि हम वेबसाइट को बेहतर बना सकें।'],
            ],
            after: ['हम आपकी जानकारी सिर्फ़ इन्हीं कामों के लिए इस्तेमाल करते हैं। हम इसे कभी किसी को बेचते या किराए पर नहीं देते।'],
        },
        {
            id: 'consent',
            title: 'आपकी सहमति',
            body: [
                'फ़ॉर्म भेजने से पहले हम आपसे एक बॉक्स पर टिक करके इस नीति से सहमति माँगते हैं। आप कभी भी हमें लिखकर अपनी सहमति वापस ले सकते हैं (नीचे "हमसे संपर्क करें" देखें)। सदस्यता के लिए सहमति वापस लेने पर आपकी सदस्यता समाप्त हो जाती है।',
            ],
        },
        {
            id: 'see',
            title: 'आपकी जानकारी कौन देख सकता है',
            list: [
                ['हमारी टीम', 'सिर्फ़ वे टीम सदस्य जिन्हें अपने काम के लिए इसकी ज़रूरत है, और हर व्यक्ति सिर्फ़ वही देखता है जो उसके पद के लिए ज़रूरी है। प्रदेश एडमिन सिर्फ़ अपना प्रदेश देखते हैं और ज़िला एडमिन सिर्फ़ अपना ज़िला। कार्यक्रम में गेट स्वयंसेवक सिर्फ़ उसी सदस्य का नाम, फ़ोटो, सदस्य संख्या और जगह देखता है जिसका कार्ड वह स्कैन करता है।'],
                ['सदस्यता कार्ड', 'आपके कार्ड का पेज, कार्ड का लिंक खोलने या उसका QR कोड स्कैन करने वाले किसी भी व्यक्ति को आपका नाम, फ़ोटो, प्रदेश, सदस्य संख्या और जुड़ने की तारीख दिखाता है। आपका मोबाइल नंबर, ईमेल, जन्म तिथि और पता वहाँ कभी नहीं दिखता।'],
                ['प्रमाण पत्र और पत्र', 'प्रमाण पत्र या पत्र के जाँच पेज पर वही दिखता है जो उस पर छपा है।'],
                ['सेवा देने वाली कंपनियाँ', 'वेबसाइट चलाने के लिए हम भरोसेमंद सेवाओं का उपयोग करते हैं: डेटाबेस (MongoDB Atlas), Cloudinary (फ़ोटो और आवाज़ संदेशों के लिए), ईमेल सेवा (ईमेल भेजने के लिए), Razorpay (भुगतान के लिए), Google Analytics (विज़िट गिनने के लिए) और आपकी ब्राउज़र कंपनी की सूचना सेवा, जैसे Google, Apple या Mozilla (सूचनाएँ पहुँचाने के लिए)। वे जानकारी सिर्फ़ हमें अपनी सेवा देने के लिए रखती हैं।'],
                ['जब कानून कहे', 'अदालत या कानून के कहने पर हम जानकारी साझा कर सकते हैं।'],
            ],
        },
        {
            id: 'keep',
            title: 'हम जानकारी कब तक रखते हैं',
            body: [
                'हम आपकी जानकारी सिर्फ़ तब तक रखते हैं जब तक उस काम के लिए ज़रूरी हो जिसके लिए आपने दी थी: सदस्यता की जानकारी तब तक जब तक आप सदस्य हैं, सहायता केंद्र के मामले बंद होने तक और उसके बाद रिकॉर्ड के लिए कुछ समय तक, और संदेश जवाब देने तक। दान का रिकॉर्ड उतने समय तक रखा जाता है जितना हिसाब-किताब के लिए कानून कहता है। कार्यक्रम के चेक-इन और पोल के जवाब आपकी सदस्यता के साथ रखे जाते हैं, और उस कार्यक्रम की चेक-इन सूची या पोल हटाने पर हट जाते हैं। सूचना भेजने का पता काम करना बंद होने पर हटा दिया जाता है, जैसे जब आप सूचनाएँ बंद कर दें। उसके बाद हम जानकारी हटा देते हैं या उसमें से आपकी पहचान बताने वाले हिस्से हटा देते हैं।',
            ],
        },
        {
            id: 'safe',
            title: 'हम जानकारी को सुरक्षित कैसे रखते हैं',
            body: [
                'वेबसाइट सुरक्षित (HTTPS) कनेक्शन का उपयोग करती है। एडमिन पैनल में सिर्फ़ हमारी टीम मज़बूत पासवर्ड से लॉगिन कर सकती है, ज़रूरी पदों के लिए दो-चरण लॉगिन के साथ, और हर व्यक्ति सिर्फ़ वही देख सकता है जो उसके पद के लिए ज़रूरी है। एडमिन पैनल में किए गए ज़रूरी बदलावों का रिकॉर्ड रखा जाता है। कोई भी सिस्टम पूरी तरह सुरक्षित नहीं होता, लेकिन अगर कभी किसी सेंधमारी का असर आपकी जानकारी पर पड़ता है, तो हम कानून के अनुसार आपको और अधिकारियों को सूचित करेंगे।',
            ],
        },
        {
            id: 'rights',
            title: 'आपके अधिकार',
            list: [
                ['जानने का', 'हमसे पूछें कि हमारे पास आपकी कौन-सी जानकारी है और हम उसका उपयोग कैसे करते हैं।'],
                ['सुधार का', 'गलत या पुरानी जानकारी को ठीक या पूरा करवाएँ। सदस्य अपना मोबाइल नंबर, ईमेल, पता और फ़ोटो "अपनी जानकारी बदलें" पेज पर खुद भी बदल सकते हैं।'],
                ['हटाने का', 'जब ज़रूरत न रहे तो अपनी जानकारी हटवाएँ (जब तक कानून उसे रखने को न कहे)।'],
                ['सहमति वापस लेने का', 'आगे से अपनी जानकारी का उपयोग रुकवाएँ।'],
                ['शिकायत का', 'पहले हमसे शिकायत करें। अगर हमारे जवाब से संतुष्ट न हों, तो आप भारतीय डेटा संरक्षण बोर्ड से शिकायत कर सकते हैं।'],
                ['नामित करने का', 'किसी व्यक्ति को नामित करें जो मृत्यु या असमर्थता की स्थिति में आपकी ओर से ये अधिकार इस्तेमाल कर सके।'],
            ],
        },
        {
            id: 'age',
            title: 'बच्चे',
            body: [
                'सिर्फ़ 18 वर्ष या उससे अधिक आयु के लोग सदस्य बन सकते हैं। अगर 18 वर्ष से कम आयु के किसी व्यक्ति को सहायता केंद्र से मदद चाहिए, तो उसके माता-पिता या अभिभावक उसकी ओर से फ़ॉर्म भरें।',
            ],
        },
        {
            id: 'contact',
            title: 'हमसे संपर्क करें',
            body: ['अपनी निजी जानकारी के बारे में किसी भी सवाल, अनुरोध या शिकायत के लिए यहाँ लिखें:'],
            grievance: true,
        },
        {
            id: 'changes',
            title: 'इस नीति में बदलाव',
            body: ['हम इस नीति को समय-समय पर बदल सकते हैं। ऊपर लिखी तारीख बताती है कि इसे आख़िरी बार कब बदला गया।'],
        },
    ],
}