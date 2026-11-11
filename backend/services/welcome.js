import { ORG } from '../config/org.js'
import { button, hero, greet, both, codeBox, signoff } from './emailLayout.js'

// The email a member gets when their application is approved
export function welcomeEmail(m) {
    const link = `${process.env.CLIENT_URL}/card/${m.cardToken}`
    const subject = `Welcome to ${ORG.name} - your membership card / आपका सदस्यता कार्ड`
    const text = [
        `जय भीम ${m.name}!`,
        `आपका सदस्यता आवेदन स्वीकार हो गया है। आपकी सदस्यता संख्या: ${m.memberNo}`,
        `अपना सदस्यता कार्ड यहाँ देखें और प्रिंट करें: ${link}`,
        '',
        `Jai Bhim ${m.name}!`,
        `Your membership application has been approved. Your member number: ${m.memberNo}`,
        `See and print your membership card here: ${link}`,
        '',
        ORG.name,
    ].join('\n')

    const html = `${hero('🎉', 'सदस्यता स्वीकार हो गई', 'Welcome to the family')}
${greet(m.name)}
${both('आपका सदस्यता आवेदन स्वीकार हो गया है। अब आप ' + ORG.name + ' परिवार का हिस्सा हैं।', 'Your membership application has been approved. You are now part of the ' + ORG.name + ' family.')}
${codeBox('सदस्यता संख्या / Member number', m.memberNo, { spacing: 1 })}
${both('अपना सदस्यता कार्ड नीचे के बटन से देखें, डाउनलोड करें या प्रिंट करें।', 'See, download or print your membership card with the button below.')}
${button('अपना कार्ड देखें / View your membership card', link)}
${signoff()}`
    return { subject, text, html }
}