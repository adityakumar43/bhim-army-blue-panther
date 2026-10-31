// The admin guide, in Hindi and English. Each part shows only to the people whose role can use it
// ("need": any one of these permissions; empty = everyone). Change the wording here.

export const GUIDE = [
    {
        id: 'start', icon: 'spark', need: [],
        hi: {
            title: 'शुरुआत',
            steps: [
                'लॉगिन: वेबसाइट के नीचे "एडमिन पैनल" पर जाएँ (या /admin/login खोलें) और अपना ईमेल व पासवर्ड डालें।',
                'फ़ोन पर: नीचे की पट्टी में मुख्य पेज हैं। बाकी सब पेज "More" में हैं, लॉग आउट भी वहीं है।',
                'कंप्यूटर पर: बाईं ओर मेन्यू है। ऊपर बीच के खोज बॉक्स से (या Ctrl+K दबाकर) किसी भी सदस्य, केस या रसीद को नाम, मोबाइल या नंबर से ढूँढें।',
                'ऐप की तरह इस्तेमाल करें: फ़ोन के ब्राउज़र में वेबसाइट खोलें और "Add to Home screen" / "Install app" चुनें।',
                'Overview पेज पर लाल "New" वाले कार्ड बताते हैं कि आज किस काम पर ध्यान देना है। कार्ड दबाकर सीधे उस पेज पर जाएँ।',
            ],
        },
        en: {
            title: 'Getting started',
            steps: [
                'Log in: use "Admin Panel" at the bottom of the website (or open /admin/login) with your email and password.',
                'On a phone: the main pages are in the bar at the bottom. Everything else, and Log out, is under "More".',
                'On a computer: the menu is on the left. Use the search box at the top (or press Ctrl+K) to find any member, case or receipt by name, mobile or number.',
                'Use it like an app: open the website in your phone browser and choose "Add to Home screen" / "Install app".',
                'On the Overview page, cards with a red "New" show what needs attention today. Tap a card to go straight there.',
            ],
        },
    },
    {
        id: 'members', icon: 'userPlus', need: ['members', 'district'],
        hi: {
            title: 'सदस्य (Members)',
            steps: [
                '"Pending" टैब में नए आवेदन आते हैं। फ़ोटो और जानकारी देखें, फिर "Approve" या "Reject" दबाएँ। स्वीकृत होते ही सदस्य संख्या और कार्ड बन जाता है।',
                'जिला एडमिन: आप आवेदन स्वीकार नहीं करते, बल्कि "I know this person" या "concern" चुनकर सुझाव देते हैं। फ़ैसला राज्य टीम करती है।',
                'कार्ड भेजना: स्वीकृत सदस्य के कार्ड पर "WhatsApp" या "Email card" दबाएँ।',
                'कई कार्ड छापने के लिए: "Approved" टैब में सदस्यों को चुनें और "Print cards" दबाएँ। A4 पर 10 कार्ड छपते हैं; प्रिंट में Scale 100% और Background graphics चालू रखें।',
                'सदस्यता समाप्त करनी हो तो "End membership" दबाएँ और कारण लिखें। कार्ड स्कैन करने पर "मान्य नहीं" दिखेगा। बाद में वापस भी कर सकते हैं।',
                '"Most active first" चुनने पर सबसे ज़्यादा कार्यक्रमों में आए सदस्य ऊपर दिखते हैं। "Download Excel" से सूची डाउनलोड करें।',
            ],
        },
        en: {
            title: 'Members',
            steps: [
                'New applications arrive in the "Pending" tab. Check the photo and details, then press "Approve" or "Reject". On approval the member number and card are made automatically.',
                'District admins: you do not approve; you recommend ("I know this person" or a concern). The state team decides.',
                'Sending the card: on an approved member, press "WhatsApp" or "Email card".',
                'To print many cards: in the "Approved" tab, tick the members and press "Print cards". 10 cards fit on A4; in the print box keep Scale at 100% and turn on Background graphics.',
                'To end a membership press "End membership" and give a reason. The card then shows "not valid" when scanned. You can restore it later.',
                'Choose "Most active first" to see the members who came to the most events at the top. "Download Excel" gives you the list.',
            ],
        },
    },
    {
        id: 'helpdesk', icon: 'help', need: ['helpdesk', 'district'],
        hi: {
            title: 'सहायता केंद्र (Help Desk)',
            steps: [
                'नए केस "New" टैब में आते हैं। 🔴 "Urgent" वाले केस सबसे पहले देखें।',
                'केस खोलें, "Handled by" में किसी साथी को चुनें, और "Status" बदलें: In progress → Resolved → Closed।',
                '"New message for the person" में लिखा संदेश शिकायतकर्ता अपनी केस संख्या से वेबसाइट पर देख सकता है; "Team note" केवल टीम देखती है। सरल और सम्मानजनक भाषा में लिखें।',
                'बदलाव सेव करने के बाद "Send update on WhatsApp" से व्यक्ति को तुरंत बताएँ।',
                'नारंगी रंग वाले केस 3 दिन या ज़्यादा से अपडेट नहीं हुए हैं, उन पर ध्यान दें।',
                'केस की जानकारी बहुत निजी होती है: इसे कभी WhatsApp ग्रुप या सोशल मीडिया पर साझा न करें।',
            ],
        },
        en: {
            title: 'Help Desk',
            steps: [
                'New cases arrive in the "New" tab. Look at 🔴 "Urgent" cases first.',
                'Open a case, choose a teammate in "Handled by", and change the "Status": In progress → Resolved → Closed.',
                'What you write in "New message for the person" is shown to them on the website with their case number; the "Team note" is seen only by staff. Use simple, respectful words.',
                'After saving a change, press "Send update on WhatsApp" to tell the person straight away.',
                'Cases in orange have had no update for 3 days or more; look at them.',
                'Case details are very private: never share them in WhatsApp groups or on social media.',
            ],
        },
    },
    {
        id: 'volunteers', icon: 'hand', need: ['members', 'district'],
        hi: {
            title: 'स्वयंसेवक (Volunteers)',
            steps: [
                'जो लोग मदद करना चाहते हैं, वे यहाँ आते हैं, उनके कौशल और समय के साथ।',
                'उनसे संपर्क करने के बाद स्थिति "Contacted" करें, काम शुरू होने पर "Active"।',
                'कौशल (जैसे सोशल मीडिया, कानूनी मदद) से छाँटकर सही व्यक्ति ढूँढें।',
            ],
        },
        en: {
            title: 'Volunteers',
            steps: [
                'People who offered to help arrive here, with what they can do and when they are free.',
                'After calling them, set the status to "Contacted"; once they start working, "Active".',
                'Filter by skill (social media, legal help, and so on) to find the right person.',
            ],
        },
    },
    {
        id: 'checkin', icon: 'ticket', need: ['members', 'content', 'district', 'checkin'],
        hi: {
            title: 'कार्यक्रम में प्रवेश (Event Check-in)',
            steps: [
                '"Event Check-in" खोलें और आज का कार्यक्रम चुनें (आज वाला सुनहरे रंग में दिखता है)।',
                '"Start scanning" दबाएँ और कैमरे की अनुमति दें। सदस्य के कार्ड (छपा हुआ या फ़ोन पर) का QR कोड पीले डिब्बे में रखें।',
                '🟢 हरा = स्वागत है, प्रवेश हुआ। 🟠 नारंगी = पहले ही प्रवेश हो चुका है। 🔴 लाल = प्रवेश नहीं (आवेदन लंबित, सदस्यता समाप्त या कार्ड गलत)।',
                'कार्ड नहीं है? सदस्य संख्या (BBP-00012) या मोबाइल नंबर लिखकर "Check in" दबाएँ।',
                'जो सदस्य नहीं हैं, उनके लिए "Add 1 guest" दबाएँ ताकि गिनती सही रहे।',
                'गलती हो जाए तो सूची में उस नाम के आगे ✕ दबाएँ। कार्यक्रम के बाद "Download Excel" से हाज़िरी सूची लें।',
                'सुझाव: अँधेरे में फ़ोन की रोशनी बढ़ाएँ; कई गेट हों तो हर गेट पर एक फ़ोन से स्कैन करें, गिनती अपने-आप जुड़ती है।',
            ],
        },
        en: {
            title: 'Event Check-in',
            steps: [
                'Open "Event Check-in" and choose today\'s event (today\'s one is outlined in gold).',
                'Press "Start scanning" and allow the camera. Hold the QR code of the member\'s card (printed or on their phone) inside the yellow box.',
                '🟢 Green = welcome, checked in. 🟠 Orange = already checked in. 🔴 Red = not let in (application waiting, membership ended or wrong card).',
                'No card? Type the member number (BBP-00012) or the mobile number and press "Check in".',
                'For people who are not members, press "Add 1 guest" so the count stays right.',
                'Made a mistake? Press ✕ next to that name in the list. After the event, "Download Excel" gives the attendance list.',
                'Tips: turn up the phone brightness in the dark; with several gates, scan with one phone at each gate. The totals add up on their own.',
            ],
        },
    },
    {
        id: 'content', icon: 'news', need: ['content'],
        hi: {
            title: 'समाचार, कार्यक्रम और होम पेज',
            steps: [
                'News / Events में "Add" दबाएँ, हिंदी और अंग्रेज़ी में शीर्षक व विवरण लिखें, फ़ोटो लगाएँ और "Publish" दबाएँ।',
                'बाद में छापना हो तो "Schedule" से समय चुनें; अधूरा काम "Save draft" से सेव करें।',
                'कार्यक्रम में तारीख, समय, जगह और राज्य भरें, ताकि वह Events Calendar में सही दिन दिखे।',
                'Gallery में फ़ोटो, Home Slider में बड़ी तस्वीरें, Home Updates में ऊपर की पट्टी के संदेश, और Videos में YouTube लिंक डालें।',
                'वेबसाइट पर हर समाचार और कार्यक्रम के नीचे "पोस्टर बनाकर शेयर करें" है: इससे WhatsApp के लिए तैयार पोस्टर बनता है।',
            ],
        },
        en: {
            title: 'News, events and the home page',
            steps: [
                'In News / Events press "Add", write the title and text in Hindi and English, add a photo and press "Publish".',
                'To publish later, choose a time with "Schedule"; save unfinished work with "Save draft".',
                'For events, fill in the date, time, place and state, so it shows on the right day in the Events Calendar.',
                'Put photos in Gallery, big pictures in Home Slider, short messages for the top strip in Home Updates, and YouTube links in Videos.',
                'On the website, every news item and event has "Share as a poster": it makes a poster ready for WhatsApp.',
            ],
        },
    },
    {
        id: 'notify', icon: 'bell', need: ['content'],
        hi: {
            title: 'फ़ोन सूचनाएँ (Phone Notifications)',
            steps: [
                'छोटा शीर्षक और संदेश लिखें, चुनें कि दबाने पर कौन-सा पेज खुले, पहले "Send a test" से खुद को भेजकर देखें, फिर "Send" दबाएँ।',
                'केवल ज़रूरी बातें भेजें (बड़े कार्यक्रम, तुरंत ख़बर)। बहुत ज़्यादा सूचनाएँ भेजने से लोग उन्हें बंद कर देते हैं।',
            ],
        },
        en: {
            title: 'Phone Notifications',
            steps: [
                'Write a short title and message, choose the page that opens when tapped, send yourself a test first with "Send a test", then press "Send".',
                'Send only important things (big events, urgent news). Too many and people turn them off.',
            ],
        },
    },
    {
        id: 'polls', icon: 'poll', need: ['members'],
        hi: {
            title: 'मतदान (Polls)',
            steps: [
                '"New poll" दबाएँ, सवाल और 2 से 6 जवाब लिखें, चुनें कि कौन जवाब दे सकता है (पूरा भारत, एक राज्य या एक ज़िला) और प्रकाशित करें।',
                '"Copy link" से /polls का लिंक WhatsApp ग्रुप में भेजें। सदस्य अपनी सदस्य संख्या और मोबाइल नंबर से एक बार जवाब देते हैं।',
                '"Results" में राज्य और ज़िले के हिसाब से नतीजे देखें; "Close now" से मतदान बंद करें।',
            ],
        },
        en: {
            title: 'Polls',
            steps: [
                'Press "New poll", write the question and 2 to 6 answers, choose who can answer (all of India, a state or a district) and publish.',
                'Use "Copy link" to send the /polls link to WhatsApp groups. Members answer once, with their member number and mobile number.',
                'See results by state and district under "Results"; close the poll with "Close now".',
            ],
        },
    },
    {
        id: 'mail', icon: 'mail', need: ['members'],
        hi: {
            title: 'सदस्यों को ईमेल और प्रमाण पत्र',
            steps: [
                '"Email Members" से सभी (या एक राज्य के) सदस्यों को ईमेल भेजें। भेजने से पहले "test to me" से खुद को परीक्षण ईमेल भेजें।',
                '"Certificates" से नियुक्ति पत्र और प्रशस्ति पत्र बनाएँ। हर पत्र पर QR कोड होता है जिससे कोई भी उसकी जाँच कर सकता है।',
            ],
        },
        en: {
            title: 'Emailing members and certificates',
            steps: [
                'Use "Email Members" to send an email to all members (or one state). Send yourself a test first ("test to me").',
                'Use "Certificates" to make appointment letters and certificates. Each has a QR code anyone can scan to check it.',
            ],
        },
    },
    {
        id: 'donations', icon: 'heart', need: ['donations'],
        hi: {
            title: 'दान (Donations)',
            steps: [
                'वेबसाइट से मिले सभी दान यहाँ दिखते हैं। हर दान की रसीद अपने-आप ईमेल हो जाती है।',
                'किसी को रसीद दोबारा चाहिए तो "Send again" दबाएँ।',
            ],
        },
        en: {
            title: 'Donations',
            steps: [
                'Every donation made on the website shows here. Each receipt is emailed automatically.',
                'If someone needs their receipt again, press "Send again".',
            ],
        },
    },
    {
        id: 'team', icon: 'users', need: ['team'],
        hi: {
            title: 'टीम और भूमिकाएँ (Team & Roles)',
            steps: [
                '"Add team member" से नया व्यक्ति जोड़ें। हर व्यक्ति को उतनी ही पहुँच दें जितनी उसके काम के लिए ज़रूरी है।',
                'राज्य एडमिन अपने राज्य के ज़िला एडमिन और गेट स्वयंसेवक (Gate Volunteer) जोड़ सकते हैं।',
                'गेट स्वयंसेवक केवल कार्ड स्कैन कर सकते हैं; बड़े कार्यक्रम से पहले उनका लॉगिन बनाएँ और कार्यक्रम के बाद "Disable" कर दें।',
                'पासवर्ड हमेशा निजी तौर पर दें (ग्रुप में नहीं)। कोई टीम छोड़े तो उसी दिन उसका खाता "Disable" करें।',
            ],
        },
        en: {
            title: 'Team & Roles',
            steps: [
                'Add a person with "Add team member". Give each person only the access their work needs.',
                'State admins can add District admins and Gate Volunteers for their own state.',
                'Gate Volunteers can only scan cards: make their logins before a big event and "Disable" them afterwards.',
                'Always share passwords privately (never in a group). When someone leaves the team, "Disable" their account the same day.',
            ],
        },
    },
    {
        id: 'safety', icon: 'shield', need: [],
        hi: {
            title: 'सुरक्षा के नियम',
            steps: [
                'अपना पासवर्ड किसी को न बताएँ, टीम के साथियों को भी नहीं। हर व्यक्ति का अपना लॉगिन होता है।',
                '"Security" पेज पर दो-चरणीय लॉगिन (two-step login) चालू करें, ताकि पासवर्ड चोरी होने पर भी खाता सुरक्षित रहे।',
                'किसी और के फ़ोन या साइबर कैफ़े में काम के बाद हमेशा "Log out" करें।',
                'सदस्यों के मोबाइल नंबर, पते या शिकायतों के स्क्रीनशॉट ग्रुप या सोशल मीडिया पर कभी न डालें।',
                'आपके हर बदलाव का रिकॉर्ड "Activity Log" में रहता है।',
            ],
        },
        en: {
            title: 'Safety rules',
            steps: [
                'Never tell anyone your password, not even teammates. Everyone has their own login.',
                'Turn on two-step login on the "Security" page, so your account stays safe even if your password is stolen.',
                'Always "Log out" after working on someone else\'s phone or in a cyber café.',
                'Never post members\' mobile numbers, addresses or screenshots of complaints in groups or on social media.',
                'Every change you make is recorded in the "Activity Log".',
            ],
        },
    },
]