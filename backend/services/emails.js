import { ORG } from '../config/org.js'
import { esc, hero, greet, both, codeBox, note, signoff } from './emailLayout.js'

// Short emails that the contact, help desk and member-update pages send.
// Kept here (not inside the routes) so they share one look and can be previewed with `npm run preview-emails`.

// "We got your message". It repeats nothing the person typed (not the message, not the name): anyone can
// type any address in the form, and an email that echoed their words could be used to send spam from our address.
export function contactReceivedEmail() {
    return {
        subject: `We received your message – ${ORG.name}`,
        text: `Jai Bhim,\n\nWe have received your message. Our team will get back to you soon.\n\nIf you did not write to us, you can ignore this email.\n\n— ${ORG.name}`,
        html: `${hero('📩', 'आपका संदेश मिल गया', 'Message received')}
${greet()}
${both('आपका संदेश हमें मिल गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।', 'We have received your message. Our team will get back to you soon.')}
${note('अगर आपने हमें नहीं लिखा, तो इस ईमेल को अनदेखा करें।<br>If you did not write to us, you can ignore this email.')}
${signoff()}`,
    }
}

// The reference number of a new help desk complaint. Again only what we made, nothing the person typed.
export function complaintReceivedEmail(refNo) {
    return {
        subject: `Your complaint reference number: ${refNo}`,
        text: `Jai Bhim,\n\nWe have received your complaint.\nYour reference number: ${refNo}\n\nUse this number with your mobile number on the Help desk page to check progress.\nIn an emergency, call 112.\n\n— ${ORG.name}`,
        html: `${hero('🛡️', 'शिकायत दर्ज हो गई', 'Complaint received')}
${greet()}
${both('आपकी शिकायत हमें मिल गई है। हमारी टीम इस पर काम करेगी।', 'We have received your complaint. Our team will work on it.')}
${codeBox('संदर्भ संख्या / Reference number', refNo)}
${both('इस संख्या और अपने मोबाइल नंबर से सहायता केंद्र पेज पर प्रगति देखें। इस ईमेल को संभाल कर रखें।', 'Use this number with your mobile number on the Help desk page to check progress. Keep this email safe.')}
${note('🚨 <strong>आपात स्थिति में 112 पर कॉल करें।</strong><br>In an emergency, call 112.', 'danger')}
${signoff()}`,
    }
}

// The 6-digit code a member needs to change their own details
export function updateCodeEmail(m, code, minutes) {
    return {
        subject: `${code} is your code to update your details`,
        text: `Jai Bhim ${m.name},\n\nYour code to update your membership details: ${code}\nIt works for ${minutes} minutes.\n\nIf you did not ask for this, ignore this email. Nothing will change.\n\n— ${ORG.name}`,
        html: `${hero('🔐', 'आपका कोड', 'Your verification code')}
${greet(m.name)}
${both('अपनी सदस्यता की जानकारी बदलने के लिए यह कोड डालें:', 'Enter this code to update your membership details:')}
${codeBox(`${minutes} मिनट तक मान्य / Works for ${minutes} minutes`, code, { spacing: 8 })}
${note('🔒 यह कोड किसी को न बताएँ। अगर आपने यह नहीं माँगा, तो इस ईमेल को अनदेखा करें, कुछ नहीं बदलेगा।<br>Do not share this code. If you did not ask for it, ignore this email: nothing will change.', 'warn')}
${signoff()}`,
    }
}

// An admin's reply to a contact message, with the person's own message quoted under it
export function contactReplyEmail({ text, sent, message }) {
    const asHtml = (s) => esc(s).replace(/\n/g, '<br>')
    return {
        subject: `Re: Your message to ${ORG.name}`,
        text: `${text}\n\n— ${ORG.name}\n\n----- Your message (${sent}) -----\n${message}`,
        html: `<p style="margin:0 0 14px">${asHtml(text).replace(/(<br>){2,}/g, '</p><p style="margin:0 0 14px">')}</p>
${signoff()}
${note(`<strong>आपका संदेश / Your message (${esc(sent)}):</strong><br>${asHtml(message)}`)}`,
    }
}
